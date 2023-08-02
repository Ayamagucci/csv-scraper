# Quotes Scraper
This is a Node.js application that scrapes data from a website and stores it in a CSV file. The application uses the cheerio library to parse the website's HTML content and extract specific data elements, and the csv-writer library to write the extracted data into a CSV file.

## Setup
1. Clone the repository to your local machine.
2. Install the required dependencies by running the following command:
```bash
npm install
```
3. Create a .env file in the root directory of the project and define the PORT environment variable:
```makefile
PORT=3000
```

## Usage
To run the scraper and generate the CSV file, simply execute the following command:
```bash
npm start
```

The application will fetch the HTML content from the specified website, scrape the data using cheerio, and then write the data into a CSV file named quotes.csv in the csv folder.

## Dependencies
- axios: For making HTTP requests to fetch the HTML content of the website.
- cheerio: For parsing and manipulating the HTML content.
- csv-writer: For writing the scraped data into a CSV file.
- express: For creating a simple server to run the application.

## Note
- Please note that web scraping may be subject to legal and ethical considerations.
    - Ensure that you have the necessary permissions to scrape data from the target website before using this application.
- Additionally, consider the website's terms of service and robots.txt guidelines to avoid any legal issues.