"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const node_schedule_1 = __importDefault(require("node-schedule"));
require('dotenv').config({ path: 'C:/Projetos/Birthday_Reminder/.env' });
function getOpenAIMessageMethod(message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const apiKey = process.env.OPENAI_API_KEY;
            const prompt = message;
            const requestBody = {
                model: "gpt-3.5-turbo",
                messages: [{ "role": "user", "content": prompt }],
                temperature: 0.2,
                n: 1,
                stream: false,
            };
            const response = yield axios_1.default.post('https://api.openai.com/v1/chat/completions', requestBody, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`
                },
            });
            const birthdayReminderMessage = response.data;
            return birthdayReminderMessage.choices[0].message.content.trim();
        }
        catch (error) {
            console.error(error.response.data);
            throw new Error("Error requesting message.");
        }
    });
}
function sendEmail(message, subject) {
    return __awaiter(this, void 0, void 0, function* () {
        var transporter = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.FROM_EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        var mailOptions = {
            from: process.env.FROM_EMAIL,
            to: process.env.TO_EMAIL,
            subject: subject,
            text: message
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(error.message);
            }
            else {
                console.log('Email sent: ' + info.response);
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const today = new Date();
        const endDateString = process.env.END_DATE;
        const messagePrompt = "I want you to write a message to my girlfriend, reminding her that my birthday is approaching. " +
            `My birthday is on ${process.env.END_DATE}. I'd like the message to be humorous, ` +
            "in a playful tone, reminding her that she needs to buy a birthday present for me. " +
            "End the message by always reminding her that her birthday present will depend on the birthday present she gives me. " +
            "Keep the message short and direct. No need for presentation or cheers/signature at the end. " +
            "Don't mention my name, neither my girlfriend's name.";
        const subjectPrompt = "I want a email subject text for an email that is my birthday reminder to my girlfriend. " +
            `My birthday is on ${process.env.END_DATE}, and I'm sending a funny email to joke with her ` +
            "You don't need to mention her or me on the text.";
        if (endDateString != null) {
            const endDate = new Date(endDateString);
            if (today <= new Date(endDate)) {
                const openAiMessage = yield getOpenAIMessageMethod(messagePrompt);
                const openAiSubject = yield getOpenAIMessageMethod(subjectPrompt);
                yield sendEmail(openAiMessage, openAiSubject);
            }
        }
    });
}
const dailyAtTenAM = node_schedule_1.default.scheduleJob('0 10 * * *', () => {
    main();
});
