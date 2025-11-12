import puppeteer from "puppeteer";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Helper function to clean major names based on your rules
 */
function cleanMajorName(name) {
    const degreeSuffixRegex = /,\s*B\.[A-Za-z]+\.?/;
    const parts = name.split(" - ");

    if (parts.length > 1) {
        // --- Case 1: Specialization exists (e.g., "Major, B.S. - Specialization") ---
        const majorPart = parts[0]; // e.g., "History, B.A."
        const specialization = parts[1].trim() // e.g., "Pre-Credential" or "General Sociology"

        if (specialization === "Pre-Credential") {
            return majorPart.replace(degreeSuffixRegex, "").trim() + " - Pre-Credential"; // ex: "History, B.A. - Pre-Credential" -> "History - Pre-Credential"
        } else if (specialization.startsWith("General")) {
            return majorPart.replace(degreeSuffixRegex, "").trim(); // ex: "Sociology, B.A. - General Sociology" -> "Sociology"
        } else {
            return specialization; // ex: "Music, B.M. - Composition" -> "Composition"
        }
    } else {
        // --- Case 2: No specialization (e.g., "Agricultural Science, B.S.") ---
        return name.replace(degreeSuffixRegex, "").trim(); // ex: "Biology, B.S." -> "Biology"
    }
}

/**
 * Manual fallback descriptions for missing major pages
 */
const FALLBACK_DESCRIPTIONS = {
    "Materials Engineering": {
        description:
            "Deal with developing products and processes based on understanding the structure of materials. The goal of the materials engineer is to understand the structure of materials (at the micro- or the nano level) to improve their properties and ultimately their performance. Materials engineers apply this knowledge to the production, selection, and utilization of materials. Since engineers are called upon to work with new ideas and materials, the engineering graduate with a minor in Materials Engineering is very well prepared to respond to such a challenge and thus has a career advantage.",
        url: "https://www.cpp.edu/engineering/cme/index.shtml",
    },
    "Aerospace Engineering": {
        description:
            "Expand your horizons with a theoretical and experimental study of aerodynamics, astrodynamics, propulsion, flight mechanics, systems engineering and aerospace vehicle design – literal rocket science and more!   Through hands-on projects and cutting-edge research that simulate the aerospace industry, as well as internships and job placements, you will graduate with both a conceptual understanding and a portfolio of real-world accomplishments. With program emphases in aeronautics and astronautics, you can chart your course and propel yourself toward your dream career in aerospace.",
        url: "https://www.cpp.edu/programs/eng/aerospace-engineering/aerospace-engineering.shtml",
    },
    "Art History": {
        description:
            "Explore the artistic legacies of historical periods, regions and cultural traditions worldwide. In Art History, you will immerse yourself in the study of production, reception and experience of art, architecture, design, mass media and other artifacts. Our program provides the flexibility to choose electives in a series of disciplines to shape your degree to your career goals.",
        url: "https://www.cpp.edu/programs/env/art/art-history.shtml",
    },
    "Artificial Intelligence Ethics and Society": {
        description:
            "Address problems raised by AI’s increasingly pervasive influence on society—problems such as algorithmic bias and the question of how to address it; moral and legal responsibility for AI decision making; displacement of a wide range of human jobs from computer coding to truck driving; and the environmental impacts of AI. Effectively addressing these problems requires skill in negotiating competing values and acute sensitivity to the social and cultural contexts in which AI’s harms and benefits arise.",
        url: "https://www.cpp.edu/class/science-technology-society/about-page.shtml#ai-ethics",
    },
};

export async function scrapeCPP() {
    const browser = await puppeteer.launch({
        headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1080 });
    await page.goto("https://www.cpp.edu/programs/index.shtml", { waitUntil: "domcontentloaded" });

    // Wait for "bachelor" checkbox and select by college view
    await page.waitForSelector("input#type0");
    await page.click("input#type0");
    await page.select("#viewType", "byCollege");
    await page.waitForSelector(".college");

    // Step 1: Scrape major names and URLs
    const collegesData = await page.evaluate(() => {
        const collegeElements = document.querySelectorAll("div.college");

        return Array.from(collegeElements).map(college => {
            const collegeHeading = college.querySelector("h2.college-heading").innerText.trim(); // e.g., "College of Agriculture"
            const departmentElements = college.querySelectorAll("div.dept-programs"); // get all the div departments with their programs

            const departments = Array.from(departmentElements).map(dept => {
                const deptHeading = dept.querySelector("h3.dept-heading").innerText.trim(); // e.g., "Animal and Veterinary Science"
                const majorLinks = dept.querySelectorAll(
                    'ul.program-list li span[ng-show="true"] span[ng-show="true"] a.program-link'
                ); // get all major links

                const majors = Array.from(majorLinks).map(link => ({
                    name: link.innerText.trim(),
                    href: link.href,
                }));

                return {
                    department: deptHeading,
                    majors,
                };
            });

            return {
                college: collegeHeading,
                departments,
            };
        });
    }); 

    // Step 2: Clean and deduplicate program names
    const cleanedData = [];
    for (const college of collegesData) {
        const departments = [];
        for (const dept of college.departments) {
            const cleanedMajors = dept.majors.map(p => ({
                name: cleanMajorName(p.name),
                href: p.href,
            }));

            // Deduplicate by name
            const uniqueMajors = Object.values(
                cleanedMajors.reduce((acc, p) => {
                    acc[p.name] = p;
                    return acc;
                }, {})
            );

            departments.push({ ...dept, majors: uniqueMajors });
        }
        cleanedData.push({ ...college, departments });
    }

    // Step 3: Visit each major link and extract paragraph
    const results = [];
    for (const college of cleanedData) {
        for (const dept of college.departments) {
            for (const major of dept.majors) {
                let description = null;
                try {
                    const majorPage = await browser.newPage();
                    await majorPage.goto(major.href, { waitUntil: "domcontentloaded", timeout: 20000 });

                    const selector = "p.body1.eggshell-heading-stat-box__copy";
                    const found = await majorPage.$(selector);

                    if (found) {
                        description = await majorPage.$eval(selector, el =>
                            el.textContent
                                .replace(/\s+/g, " ")    // Collapse all whitespace/newlines into single spaces
                                .trim()
                        );
                    }

                    await majorPage.close();
                } catch (err) {
                    console.warn(`⚠️ Failed to fetch ${major.name}: ${err.message}`);
                }

                // Step 4: Use fallback if missing
                if (!description && FALLBACK_DESCRIPTIONS[major.name]) {
                    description = FALLBACK_DESCRIPTIONS[major.name].description;
                    major.href = FALLBACK_DESCRIPTIONS[major.name].url || major.href;
                }

                results.push({
                    college: college.college,
                    department: dept.department,
                    major: major.name,
                    url: major.href,
                    description: description || "N/A",
                });
            }
        }
    }

    // Step 5: Save to JSON file
    fs.writeFileSync("cpp_majors.json", JSON.stringify(results, null, 2));
    console.log("Data saved to cpp_majors.json");

    await browser.close();

    // Step 6: Store results in the database
    console.log("Saving data to database...");

    for (const entry of results) {
        const { college, department, major, url, description } = entry;

        // 1. Upsert college
        const dbCollege = await prisma.college.upsert({
            where: { name: college },
            update: {},
            create: { name: college },
        });

        // 2. Upsert department
        const dbDepartment = await prisma.department.upsert({
            where: {
                name_collegeId: {
                    name: department,
                    collegeId: dbCollege.id,
                },
            },
            update: {},
            create: {
                name: department,
                collegeId: dbCollege.id,
            },
        });

        // 3. Upsert major
        await prisma.major.upsert({
            where: {
                name_departmentId: {
                    name: major,
                    departmentId: dbDepartment.id,
                },
            },
            update: {
                url,
                description,
            },
            create: {
                name: major,
                url,
                description,
                departmentId: dbDepartment.id,
            },
        });
    }

    console.log("Database updated!");
    return results;
}

scrapeCPP().then(() => {
    console.log("--- Scraping and enrichment complete! ---");
});
