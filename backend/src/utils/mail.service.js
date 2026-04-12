const nodemailer = require("nodemailer");
require("dotenv").config();

class MailService{
    #transport
    constructor(){
        try{
            this.#transport = nodemailer.createTransport({
            host:process.env.SMTP_HOST,
            port:process.env.SMTP_PORT,
            service:"gmail",
            auth:{
                user:process.env.SMTP_USER,
                pass:process.env.SMTP_PASSWORD
            }
        })

        }catch(error){
            process.exit(1) 
        }
    }
    sendMail = async(to, subject, message, attachments= null)=>{
        try {
            const msgOpt = {
                to :to,
                from:process.env.SMTP_FROM,
                subject:subject,
                html:message
            }
            if(attachments){
                msgOpt['attachments'] = attachments
            }
            const response = await this.#transport.sendMail(msgOpt) 
            return response
            
            
        } catch (error) {
            throw{status:500, message:"Failed to send mail", error:error}
        }
    }
}

module.exports = new MailService()
