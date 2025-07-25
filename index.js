import puppeteer from "puppeteer";
import fs from "fs";
const seasonIndexes = {
    2025: 0,
    2024: 1,
    2023: 2,
    2022: 3,
    2021: 4,
};

const statTypes = {
    orangeCap: 1,
    mostFours: 3,
    mostSixes: 5,
    mostFifties: 6,
    mostCenturies: 7,
};

const jsonData = {};

const selectSeasonOption = async (page, index) => {
    // Open dropdown
    await page.waitForSelector(".customSelecBox:nth-child(1) .cSBDisplay", {
        visible: true,
    });
    await page.click(".customSelecBox:nth-child(1) .cSBDisplay");

    // Wait and select season option by index
    await page.waitForSelector(".customSelecBox:nth-child(1) .cSBListItems", {
        visible: true,
    });
    await page.click(
        `.customSelecBox:nth-child(1) .cSBListItems:nth-child(${index + 1})`
    );

    // Wait for table to update (20th row to ensure table loaded)
    await page.waitForSelector("table.st-table tbody tr:nth-child(20)");
};

const selectTypeOption = async (page, index) => {
    // Open dropdown
    await page.waitForSelector(".statsTypeFilter .cSBDisplay", {
        visible: true,
    });
    await page.click(".statsTypeFilter .cSBDisplay");

    // Wait and select season option by index
    await page.waitForSelector(".statsTypeFilter .cSBListItems", {
        visible: true,
    });
    await page.click(`.statsTypeFilter .cSBListItems:nth-child(${index + 1})`);

    // Wait for table to update (20th row to ensure table loaded)
    await new Promise((resolve) => setTimeout(resolve, 3000));
};

const extractData = async (page) => {
    return await page.evaluate(() => {
        const rows = Array.from(
            document.querySelectorAll("table.st-table tbody tr")
        );
        return rows
            .map((row) => {
                const cols = row.querySelectorAll("td");
                return {
                    position: cols[0]?.innerText.trim() || "",
                    player:
                        cols[1]
                            ?.querySelector(".st-ply-name")
                            ?.innerText.trim() || "",
                    team:
                        cols[1]
                            ?.querySelector(".st-ply-tm-name")
                            ?.innerText.trim() || "",
                    value: cols[2]?.innerText.trim() || "",
                };
            })
            .filter((row) => {
                return row.value != "";
            });
    });
};

const scrapeIPL = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36");
    await page.goto("https://www.iplt20.com/stats/", {waitUntil: "domcontentloaded",timeout: 0});

    for (const [season, seasonIndex] of Object.entries(seasonIndexes)) {
        jsonData[season] = {};
        await selectSeasonOption(page, seasonIndex);
    
        for (const [statName, statIndex] of Object.entries(statTypes)) {
            await selectTypeOption(page, statIndex);
            jsonData[season][statName] = await extractData(page);
        }
    }

    await browser.close();

    fs.writeFile("ipl-stats.json", JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log("JSON file saved: ipl-stats.json");
        }
    });
};

scrapeIPL();





