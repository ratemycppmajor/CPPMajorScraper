import XLSX from "xlsx";

/**
 * Reads the Excel file and extracts GPA data
 * @param excelPath Path to the Excel file
 * @returns Map of major names to arrays of GPAs (for matching multiple records)
 */
export const parseAvgGPA = (excelPath: string): Map<string, number[]> => {
    // Load the workbook
    const workbook = XLSX.readFile(excelPath);

    // Find the sheet named "FTS Avg GPA by Major"
    const sheetName = workbook.SheetNames.find(name => name === "FTS Avg GPA by Major");

    if (!sheetName) {
        throw new Error(`Sheet "FTS Avg GPA by Major" not found. Available Sheets - ${workbook.SheetNames.join(", ")}`);
    }

    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    // Find column indices/names
    const firstRow = data[0];
    if (!firstRow) {
        throw new Error("Excel sheet is empty");
    }

    // Find the column names
    const majorColumnKey = Object.keys(firstRow).find(key => key === "Acad Plan/Major");

    const gpaColumnKey = Object.keys(firstRow).find(key => key === "Average GPA");

    if (!majorColumnKey) {
        throw new Error(`Could not find "Acad Plan/Major" column.`);
    }

    if (!gpaColumnKey) {
        throw new Error(`Could not find "Average GPA" column.`);
    }

    console.log(`Found major column: "${majorColumnKey}"`);
    console.log(`Found GPA column: "${gpaColumnKey}"`);

    // Create a map to store all matching records for each major
    const majorGpaMap = new Map<string, number[]>();

    // Process each row
    for (const row of data) {
        const majorName = row[majorColumnKey]; // row["Acad Plan/Major"] "Computer Science"
        const gpa = row[gpaColumnKey]; // row["Average GPA"]  3.24

        const majorNameStr = String(majorName).trim();
        
        // Store all GPAs for this major name
        if (!majorGpaMap.has(majorNameStr)) {
            majorGpaMap.set(majorNameStr, []);
        }
        majorGpaMap.get(majorNameStr)!.push(gpa);
    }

    console.log(`Loaded ${majorGpaMap.size} unique major entries from Excel`);

    return majorGpaMap;
};


/**
 * Finds matching records for a major and calculates average GPA
 * @param majorName The major name to search for
 * @param gpaMap Map of all GPA records from Excel
 * @returns Average GPA or null if no matches found
 */
export const calculateAverageGPAForMajor = (
    majorName: string,
    gpaMap: Map<string, number[]>
): number | null => {
    const matchingGPAs: number[] = [];

    // Search for all records where the major name contains the search term    
    for (const [excelMajorName, gpas] of gpaMap.entries()) {
        if (excelMajorName.includes(majorName)) {
            matchingGPAs.push(...gpas);
        }
    }

    if (matchingGPAs.length === 0) {
        return null;
    }

    const sum = matchingGPAs.reduce((acc, gpa) => acc + gpa, 0);
    const average = sum / matchingGPAs.length;

    return Math.round(average * 100) / 100; // Round to 2 decimal places
};
