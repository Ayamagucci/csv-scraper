require('dotenv').config();
const { PORT } = process.env;
const express = require('express');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();

// function for scraping jobs off site
const scrapeJobs = async(site) => {
  try {
    // fetch HTML content
    const jobQuery = await axios.get(site);

    // load res data into Cheerio
    const $ = cheerio.load(jobQuery.data);

    // select job elems using CSS selector
    const jobElems = $('.job-item');

    // store scraped data into array
    const jobs = [];

    // iterate through jobElems —> extract data
    jobElems.each((i, job) => {
      const title = $(job)
        .find('a').attr('title');

      const company = $(job)
        .find('.job-company').text().trim();

      const place = $(job)
        .find('.job-place').text().trim();

      const type = $(job)
        .find('.job-type').text().trim();

      const date = $(job)
        .find('.job-date').text().trim();

      jobs.push({ title, company, place, type, date });
    });

    // output scraped jobs
    console.log('Jobs successfully scraped!');
    console.dir(jobs);

    return jobs;

  } catch(err) {
    console.error(`Error scraping jobs: ${ err.message }`);
  }
};

// function for writing jobs to CSV
const writeJobsToCsv = async(data) => {
  // create CSV writer w/ specified header fields
  const csvWriter = createCsvWriter({
    path: 'csv/jobs.csv',
    header: [
      { id: 'title', title: 'Title' },
      { id: 'company', title: 'Company' },
      { id: 'place', title: 'Place' },
      { id: 'type', title: 'Type' },
      { id: 'date', title: 'Date' }
    ]
  });

  try {
    await csvWriter.writeRecords(data);

    // output message indicating success
    console.log('Jobs successfully written to CSV file!');
    // console.dir(data);

  } catch(err) {
    console.error(`Error writing data to CSV: ${ err }`);
  }
};

// scrape site —> write data to CSV
(async() => {
  // write jobs to CSV **
  const jobs = await scrapeJobs('https://www.ranchwork.com/jcategory/seeking-ranch-job');
  writeJobsToCsv(jobs);
})();

app.listen(PORT, () => {
  console.log(`Server listening on PORT: ${ PORT }`);
});