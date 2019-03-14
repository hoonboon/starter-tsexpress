import { Response } from "express";
import puppeteer from "puppeteer";

import { Logger } from "./logger";
const logger = new Logger("util.pdfGenerator");

export class PdfGenerator {
    static browser: puppeteer.Browser = undefined;

    static async sendPdf(res: Response, targetPageUrl: string) {
        logger.debug("test00: ");
        if (!PdfGenerator.browser) {
            logger.debug("init PdfGenerator.browser");
            PdfGenerator.browser = await puppeteer.launch({args: ["--proxy-server='direct://'", "--proxy-bypass-list=*"]});
        }
        logger.debug("test01: ");
        const page = await PdfGenerator.browser.newPage();
        logger.debug("test02: ");
        const response = await page.goto(targetPageUrl, {
            waitUntil: ["load", "domcontentloaded", "networkidle0"],
        });
        logger.debug("test03: ");
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
        });
        logger.debug("test04: ");
        res.send(pdfBuffer);
        logger.debug("test05: ");
        await page.close();
    }
}
