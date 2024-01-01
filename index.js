import axios from "axios";
import * as cheerio from 'cheerio';
import fs from 'fs';
import puppeteer from "puppeteer";

const url = "https://www.pdfdrive.com/category/112/";

const main = async (url) => {
	let books = []
	try {
		const browser = await puppeteer.launch({ headless: "new" });
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: "load" });

		const { data } = await axios.get(page.url());
		const $ = cheerio.load(data);
		const allPages = $(".Zebra_Pagination ul").find("li").length

		for (let i = 0; i < allPages - 2; i++) {
			console.log(`scraping ${page.url()}`)
			await scrapeBooksForOnePage(page.url(), books)
			await page.click(".Zebra_Pagination ul li a.next")
		}
		console.log(`Total ${books.length} books has been scraped`);

		fs.writeFile("books.json", JSON.stringify(books, null, 2), (err) => {
			if (err) {
				console.error(err);
				return;
			}
			console.log("Successfully written data to file");
		});

		await browser.close();

	} catch (error) {
		console.error(error)
	}
}

async function scrapeBooksForOnePage(url, books) {

	const api = "https://www.pdfdrive.com"
	try {
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		const booksList = $(".files-new").find(".col-sm")
		booksList.each(async (_, el) => {
			const book = { title: "", image: "", pageCount: "", publishedAt: "", fileSize: "", details: {} }
			book.title = $(el).find("h2").text()
			book.image = $(el).find("img").attr("src")
			book.pageCount = $(el).find(".fi-pagecount").text()
			book.publishedAt = $(el).find(".fi-year").text()
			book.fileSize = $(el).find(".fi-size").text()
			let endpoint = $(el).find(".file-right").children("a").attr("href")
			book.details = await scrapDetailsForOneBook(endpoint)
			books.push(book)
		})

	} catch (err) {
		console.error(err);
	}
}

async function scrapDetailsForOneBook(endpoint) {
	const api = "https://www.pdfdrive.com"
	try {
		const { data } = await axios.get(api + endpoint)
		const $ = cheerio.load(data);
		const bookInfo = $(".ebook-right")
		const bookDetails = { language: "", tags: [], downloadLink: "" }
		bookDetails.language = bookInfo.find(".ebook-file-info span:last").text()
		bookInfo.find(".ebook-tags a").each((_, a) => {
			bookDetails.tags.push($(a).text())
		})
		const bookButtons = $(".ebook-buttons")
		bookDetails.downloadLink = api + bookButtons.find("span a").attr("href")
		return { ...bookDetails };
	}
	catch (err) {
		console.error(err)
	}
}

// Main function call
main(url)
