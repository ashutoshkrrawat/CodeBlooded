import puppeteer from 'puppeteer';
import {etDisasterLink} from '../constants/scraperLinks.js';

// Scrapes Heading and link of disaster news
const scrapeETDisaster = async (limit = 5) => {
    const safeLimit = Math.max(1, Number(limit) || 5);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
    );

    await page.goto(etDisasterLink, {
        waitUntil: 'domcontentloaded',
        timeout: 0,
    });

    await page.waitForSelector('body');
    await page.waitForTimeout(4000);

    await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) {
            window.scrollBy(0, window.innerHeight);
            await new Promise((r) => setTimeout(r, 1000));
        }
    });

    const articles = await page.evaluate((limit) => {
        return Array.from(document.querySelectorAll('a'))
            .filter(
                (a) =>
                    a.href.includes('/news') && a.innerText.trim().length > 30
            )
            .slice(0, limit)
            .map((a) => ({
                title: a.innerText.trim(),
                link: a.href,
            }));
    }, safeLimit);

    await page.close();
    await browser.close();

    return articles;
};

// Scrapes full article content
const scrapeETArticle = async (browser, url) => {
    const page = await browser.newPage();

    try {
        await page.setUserAgent(
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
        );

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 0,
        });

        await page.waitForSelector('body');
        await page.waitForTimeout(3000);

        return await page.evaluate(() => {
            const title = document.querySelector('h1')?.innerText.trim() || '';

            const paragraphs = Array.from(document.querySelectorAll('p'))
                .map((p) => p.innerText.trim())
                .filter(
                    (text) =>
                        text.length > 30 &&
                        !text
                            .toLowerCase()
                            .includes('listen to this article') &&
                        !text.toLowerCase().includes('report to admin') &&
                        !text.toLowerCase().includes('stock') &&
                        !text.toLowerCase().includes('radar') &&
                        !text.toLowerCase().includes('budget') &&
                        !text.toLowerCase().includes('trade')
                );

            return {
                title,
                content: paragraphs.join(' '), // ONE paragraph
            };
        });

    } catch (err) {
        console.error('Article scrape failed:', url);
        return {title: '', content: ''};
    } finally {
        await page.close();
    }
};

// Scrapes all articles sequentially
const scrapeAllArticlesSequentially = async (links) => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const results = [];

    for (let i = 0; i < links.length; i++) {
        const {link} = links[i];

        console.log(`Scraping article ${i + 1}/${links.length}`);
        console.log(link);

        const articleData = await scrapeETArticle(browser, link);

        results.push({
            link,
            ...articleData,
        });

        await new Promise((r) => setTimeout(r, 3000));
    }

    await browser.close();
    return results;
};

const scrapeAllDisasterNews = async (limit = 5) => {
    const disasterArticles = await scrapeETDisaster(limit);

    const fullArticles = await scrapeAllArticlesSequentially(disasterArticles);
    return fullArticles;
};

// Manually scrape 3 news articles for testing
// scrapeAllDisasterNews(1)
//     .then((data) => {
//         console.log('Final scraped data:');
//         console.dir(data, {depth: null});
//     })
//     .catch((err) => {
//         console.error(err?.message || err);
//     });

export {scrapeAllDisasterNews};