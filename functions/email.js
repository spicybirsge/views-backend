const nodemailer = require('nodemailer')

sendemail = async(message, subject, reciever) => {
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD
        }
      });
      const mailOptions = {
        from: process.env.EMAIL,
        to: reciever,
        subject: subject,
        text: message
      };
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    })
}