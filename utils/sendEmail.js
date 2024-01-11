const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere' });

const sendEmail = async (opt) => {
  try {
    const messageData = {
      from: "mailgun@sandbox-123.mailgun.org",
      to: opt.email || ["test@example.com"],
      subject: opt.subject || "Hello",
      text: opt.message || "Testing some Mailgun awesomeness!",
    };

    const response = await mg.messages.create('sandbox-123.mailgun.org', messageData);
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = sendEmail;
