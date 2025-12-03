<a id="readme-top"></a>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

CPPMajorScraper is a scraper and parser that scrapes Cal Poly Pomona Acacdemic Programs website for its list of majors and parses the average GPA of each major from an .xlsx file.



<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![TypeScript][TypeScript]][TypeScript-url]
* [![Puppeteer][Puppeteer]][Puppeteer-url]
* [![Prisma][Prisma]][Prisma-url]
* [![Supabase][Supabase]][Supabase-url]


<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running, follow these simple example steps.

### Prerequisites

1. Create a `.env` in the root directory.
2. Create a Supabase account, create a new project, and find the `.env` for Prisma ORM.


### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/ratemycppmajor/CPPMajorScraper
   ```
2. Install NPM packages
   ```sh
   npm install
   ```

3. Create a prisma schema and add the database URL from your Supabase connection for Prisma ORM in `.env`
   ```sh
   npx prisma init
   # Connect to Supabase via connection pooling
   DATABASE_URL=""
   ```
   
4. Enter your API keys in the root directory `.env`
   ```js
   DATABASE_URL=""
   ```

5. Run the application
   ```sh
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[TypeScript]: https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square
[TypeScript-url]: https://www.typescriptlang.org
[Puppeteer]: https://img.shields.io/badge/Puppeteer-%2340B5A4.svg?style=for-the-badge&logo=Puppeteer&logoColor=black
[Puppeteer-url]: https://pptr.dev
[Prisma]: https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white
[Prisma-url]: https://www.prisma.io
[Supabase]: https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com
