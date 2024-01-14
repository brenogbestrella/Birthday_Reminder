import axios from "axios";
import nodemailer from "nodemailer";
import schedule from "node-schedule";
require('dotenv').config({ path: 'C:/Projetos/Birthday_Reminder/.env' });

async function getOpenAIMessageMethod(message: string): Promise<string> {
  try {
      const apiKey = process.env.OPENAI_API_KEY;
      const prompt = message;
      
      
      const requestBody= {
          model: "gpt-3.5-turbo",
          messages: [{"role": "user", "content": prompt}],
          temperature: 0.2,
          n: 1,
          stream: false,
      }

      const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`
          },
      });

      const birthdayReminderMessage = response.data;

      return birthdayReminderMessage.choices[0].message.content.trim() as string;

  } catch (error: any) {
      console.error(error.response.data);
      throw new Error("Error requesting message.")
  }
}

async function sendEmail(message:string, subject: string): Promise<void> {
  var transporter = nodemailer.createTransport({
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
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.error(error.message);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

async function main(): Promise<void> {
  const today = new Date();
  const endDateString = process.env.END_DATE as string;
  const messagePrompt = "I want you to write a message to my girlfriend, reminding her that my birthday is approaching. "+ 
  `My birthday is on ${process.env.END_DATE}. I'd like the message to be humorous, `+
  "in a playful tone, reminding her that she needs to buy a birthday present for me. "+ 
  "End the message by always reminding her that her birthday present will depend on the birthday present she gives me. "+ 
  "Keep the message short and direct. No need for presentation or cheers/signature at the end. "+
  "Don't mention my name, neither my girlfriend's name.";
  const subjectPrompt = "I want a email subject text for an email that is my birthday reminder to my girlfriend. " +
                        `My birthday is on ${process.env.END_DATE}, and I'm sending a funny email to joke with her ` +
                        "You don't need to mention her or me on the text."

  if (endDateString != null) {
    const endDate = new Date(endDateString);

    if (today <= new Date(endDate)) {
      const openAiMessage = await getOpenAIMessageMethod(messagePrompt);
      const openAiSubject = await getOpenAIMessageMethod(subjectPrompt);

      await sendEmail(openAiMessage, openAiSubject);
    }
  }
}

const dailyAtTenAM = schedule.scheduleJob('0 10 * * *', () => {
  main();
})
