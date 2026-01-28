import { Request, Response } from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Transaction } from '../models/Transaction'; // 👈 เรียกใช้ Transaction ที่คุณมี
import { User } from '../models/User'; // 👈 เรียกใช้ User

puppeteer.use(StealthPlugin());

const MY_WALLET_NUMBER = '0649525694'; //ใส่เบอร์ที่จะรับเงินของtruemoneyตรงนี้นะ อันนี้เบอร์ทดลอง 0649525694
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'; // เช็ค Path ให้ถูก

// ✅ 1. ฟังก์ชันดึงยอดเงิน (API: GET /api/redeem/balance)
export const getBalance = async (req: Request, res: Response) => {
    try {
        // ใช้ demo_user ไปก่อน (ระบบจริงค่อยเปลี่ยนเป็น ID จากการ Login)
        let user = await User.findOne({ username: 'demo_user' });

        // ถ้ายังไม่มี User ให้สร้างใหม่ และเริ่มที่ 0 บาท
        if (!user) {
            user = await User.create({ username: 'demo_user', balance: 0.00 });
        }

        res.json({ balance: user.balance });
    } catch (error) {
        console.error('Get Balance Error:', error);
        res.status(500).json({ message: 'Error fetching balance' });
    }
};

// ✅ 2. ฟังก์ชันรับเงิน (API: POST /api/redeem)
export const redeemGift = async (req: Request, res: Response) => {
    const { link } = req.body;
    console.log('📩 Processing Link:', link);

    if (!link || !link.includes('gift.truemoney.com')) {
        return res.status(400).json({ success: false, message: 'Invalid Link' });
    }

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true, // หรือ "new"
            executablePath: CHROME_PATH,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 414, height: 896 });

        // --- เริ่มขั้นตอน Puppeteer ---
        await page.goto(link, { waitUntil: 'networkidle2' });

        // หาชื่อผู้ส่ง
        let senderName = "Unknown";
        try {
            senderName = await page.evaluate(() => {
                const bodyText = document.body.innerText;
                const lines = bodyText.split('\n');
                const index = lines.findIndex((l: any) => l.includes('ส่งของทรูมันนี่ให้คุณ'));
                return index > 0 ? lines[index - 1].trim() : "Unknown";
            });
        } catch (e) { }

        // กรอกเบอร์
        const inputSelector = '#mobile-text-field';
        await page.waitForSelector(inputSelector, { timeout: 5000 });
        await page.type(inputSelector, MY_WALLET_NUMBER);
        await page.keyboard.press('Enter');

        // กดปุ่มรับซอง
        const btnClicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find((btn: any) => btn.innerText.includes('รับซองเลย'));
            if (b) { (b as HTMLElement).click(); return true; }
            return false;
        });
        if (!btnClicked) throw new Error('Button not found');

        // รอและฉีกซอง
        await new Promise(r => setTimeout(r, 4000));
        const client = await page.target().createCDPSession();
        await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 207, y: 400, button: 'left', clickCount: 1 });
        await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 207, y: 400, button: 'left', clickCount: 1 });

        // รอผลลัพธ์
        await page.waitForFunction(() => {
            return document.body.innerText.includes('฿') || document.body.innerText.includes('ได้รับเงิน');
        }, { timeout: 10000 });

        // ดึงยอดเงิน
        const result = await page.evaluate(() => {
            const text = document.body.innerText;
            const amountMatch = text.match(/฿\s*([\d,]+\.?\d*)/);
            return amountMatch ? amountMatch[1] : "0.00";
        });
        // --- จบขั้นตอน Puppeteer ---

        // 🔥🔥🔥 บันทึกลง Database 🔥🔥🔥
        const amount = parseFloat(result.replace(/,/g, ''));
        if (amount > 0) {
            // 1. อัปเดตยอดเงินใน User
            let user = await User.findOne({ username: 'demo_user' });
            if (!user) user = await User.create({ username: 'demo_user', balance: 0 });

            user.balance += amount;
            await user.save();

            // 2. บันทึกประวัติใน Transaction (ตาม Model ที่คุณมี)
            await Transaction.create({
                code: link,
                amount: amount,
                sender: senderName,
                status: 'success'
            });

            console.log(`💰 Saved to DB! New Balance: ${user.balance}`);
        }

        res.json({ success: true, amount: result, sender: senderName });

    } catch (error: any) {
        console.error('Redeem Error:', error.message);
        res.status(500).json({ success: false, message: 'Redeem failed' });
    } finally {
        if (browser) await browser.close();
    }
};