import puppeteer from "puppeteer";

const url = "https://www.pdfdrive.com/category/112"

const main = async () => {
	// Launch the browser and open a new blank page
	const browser = await puppeteer.launch({ headless: "new" });
	const page = await browser.newPage();

	// Navigate the page to a URL
	await page.goto(url);

	const allBooks = await page.evaluate(() => {
		const data = {}

		const category = document.querySelector(".collection-title").innerText
		const booksDiv = document.querySelectorAll(".col-sm")
		const books = []
		booksDiv.forEach(book => {
			const title = book.querySelector(".file-right > a > h2").innerText
			const info = book.querySelector(".file-info").innerText
			const imgURL = book.querySelector(".file-left > a > img").src

			books.push({ title, info, imgURL })
		})

		data[category] = books
		return data
	})

	console.log(allBooks)

	await browser.close();
};

main()
