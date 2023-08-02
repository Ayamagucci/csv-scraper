require('dotenv').config();
const { PORT } = process.env;
const express = require('express');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();

const server = app.listen(PORT, () => {
  console.log(`Server listening on PORT: ${ PORT }`);
});

const scrapeSpecifics = async(url, page) => {
  try {
    const query = await axios.get(url);
    const $ = cheerio.load(query.data);

    const details = {};

    $('.col-md-9').each((i, elem) => {
      const label = $(elem).prev('.col-md-3')
        .text().trim().replace(':', '');

      const val = $(elem).text().trim();

      details[ label ] = val;
    });

    // console.log(`Specifics scraped from URL: ${ url }`);
    // console.dir(details);

    return details;

  } catch(err) {
    console.error(`Error scraping specifics on page ${ page }: ${ err.message }`);
  }
};

// function for scraping jobs off site
const scrapeJobs = async(page) => {
  try {
    // generate URL based on page num
    const site = (page === 1)
      ? (`https://www.ranchwork.com/jcategory/all-ranch-jobs/`)
      : (`https://www.ranchwork.com/jcategory/all-ranch-jobs/page/${ page }/`);

    // fetch HTML content
    const jobQuery = await axios.get(site);

    // load res data into Cheerio
    const $ = cheerio.load(jobQuery.data);

    // select job elems using CSS selector
    const jobElems = $('.job-item');

    // store scraped data into array
    const jobs = [];

    // store promises for each job
    const promises = [];

    // iterate through jobElems —> extract data **
    jobElems.each((i, job) => {
      // skip filled / expired jobs
      if ($(job).hasClass('filled-expired-job')) {
        return;
      }

      // desired fields
      const title = $(job).find('a').attr('title');
      const company = $(job).find('.job-company').text().trim();
      const place = $(job).find('.job-place').text().trim();
      const type = $(job).find('.job-type').text().trim();
      const date = $(job).find('.job-date').text().trim();

      // fetch specifics
      const specificsPromise = scrapeSpecifics(
        $(job).find('a').attr('href'), page
      );

      promises.push(specificsPromise.then((specifics) => {
        const email = specifics[ 'Email' ];
        const phone = specifics[ 'Phone' ];
        const salary = specifics[ 'Salary' ];
        // const housing = specifics[ 'Housing Needed' ];
        const experience = specifics[ 'Experience' ];

        // add data to jobs array
        jobs.push({
          title,
          company,
          email,
          phone,
          salary,
          // housing,
          experience,
          place,
          type,
          date
        });
      }));
    });

    // wait for all promises to resolve before continuing
    await Promise.all(promises);

    // output scraped jobs
    console.log(`Jobs on page ${ page } successfully scraped!`);
    // console.dir(jobs);

    return jobs;

  } catch(err) {
    console.error(`Error scraping jobs on page ${ page }: ${ err.message }`);
  }
};

// function for scraping seekers off site
const scrapeSeekers = async(page) => {
  try {
    // generate URL based on page num
    const site = (page === 1)
      ? (`https://www.ranchwork.com/jcategory/seeking-ranch-job/`)
      : (`https://www.ranchwork.com/jcategory/seeking-ranch-job/page/${ page }/`);

    // fetch HTML content
    const seekerQuery = await axios.get(site);

    // load res data into Cheerio
    const $ = cheerio.load(seekerQuery.data);

    // select seeker elems using CSS selector
    const seekerElems = $('.job-item');

    // store scraped data into array
    const seekers = [];

    // store promises for each seeker
    const promises = [];

    // iterate through seekerElems —> extract data **
    seekerElems.each((i, seeker) => {
      // skip filled / expired seekers
      if ($(seeker).hasClass('filled-expired-job')) {
        return;
      }

      // desired fields
      const title = $(seeker).find('a').attr('title');
      const company = $(seeker).find('.job-company').text().trim();
      const place = $(seeker).find('.job-place').text().trim();
      const type = $(seeker).find('.job-type').text().trim();
      const date = $(seeker).find('.job-date').text().trim();

      // fetch specifics
      const specificsPromise = scrapeSpecifics(
        $(seeker).find('a').attr('href'), page
      );

      promises.push(specificsPromise.then((specifics) => {
        const email = specifics[ 'Email' ];
        const phone = specifics[ 'Phone' ];
        const salary = specifics[ 'Salary' ];
        const housing = specifics[ 'Housing Needed' ];
        const experience = specifics[ 'Experience' ];

        // add data to jobs array
        seekers.push({
          title,
          company,
          email,
          phone,
          salary,
          housing,
          experience,
          place,
          type,
          date
        });
      }));
    });

    // wait for all promises to resolve before continuing
    await Promise.all(promises);

    // output scraped seekers
    console.log(`Seekers on page ${ page } successfully scraped!`);
    // console.dir(seekers);

    return seekers;

  } catch(err) {
    console.error(`Error scraping seekers on page ${ page }: ${ err.message }`);
  }
};

const scrapeMultiplePages = async(scraper, numPages) => {
  const result = [];

  // iterate through all pages
  for (let page = 1; page <= numPages; page++) {
    const data = await scraper(page);

    result.push(...data);
  }

  return result;
};

// function for writing jobs / seekers to CSV **
const writeToCsv = async(type, data) => {
  // specified header fields
  const headers = [
    { id: 'title', title: 'Title' },
    { id: 'company', title: 'Company' },
    { id: 'email', title: 'Email' },
    { id: 'phone', title: 'Phone' },
    { id: 'place', title: 'Place' },
    { id: 'salary', title: 'Salary' },
    { id: 'experience', title: 'Experience' },
    { id: 'type', title: 'Type' },
    { id: 'date', title: 'Date' }
  ];

  // conditionally add 'housing' field for seekers
  if (type === 'seekers') {
    headers.splice(6, 0, { id: 'housing', title: 'Housing' });
  }

  // create CSV writer w/ updated header
  const csvWriter = createCsvWriter({
    path: `csv/${ type }.csv`,
    headers: headers
  });

  try {
    await csvWriter.writeRecords(data);

    // output message indicating success
    console.log(`${ type[0].toUpperCase() + type.slice(1) } successfully written to CSV file!`);
    // console.dir(data);

  } catch(err) {
    console.error(`Error writing ${ type } to CSV: ${ err.message }`);
  }
};

// scrape site —> write data to CSV
(async() => {
  // write jobs to CSV **
  const jobs = await scrapeMultiplePages(scrapeJobs, 49);
  writeToCsv('jobs', jobs);

  // await seekers to CSV **
  const seekers = await scrapeMultiplePages(scrapeSeekers, 11);
  writeToCsv('seekers', seekers);

  // manually close server after writing CSVs
  server.close(() => {
    console.log('Server closed!');
  });
})();