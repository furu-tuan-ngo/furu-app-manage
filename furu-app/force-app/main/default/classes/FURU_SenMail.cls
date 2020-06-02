global with sharing class FURU_SenMail {
    private static final String templateMail = 'BirthDate';

    global static void send(List<Contact> contacts) {
        try {
            System.debug(contacts);
            if(!contacts.isEmpty()) {
                Messaging.reserveSingleEmailCapacity(1);
                Messaging.SingleEmailMessage[] mails = new List<Messaging.SingleEmailMessage>(); 
                
                EmailTemplate emailTemplate = [SELECT Id, Subject, Description, HtmlValue, DeveloperName, Body FROM EmailTemplate WHERE DeveloperName = :templateMail];
                
                if(emailTemplate != null) {
                    for(Contact con : contacts) {
                        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                        
                        mail.setTargetObjectId(con.Id);
                        mail.setTemplateId(emailTemplate.Id);
                        mail.setCharset('UTF-8');
                        
                        mails.add(mail);
                    }
                    
                
                    Messaging.SendEmailResult[] results = Messaging.sendEmail(mails);
                    system.debug(results);
                    if(results.size() > 0) {
                        if (results[0].success) {	
                            System.debug('The email was sent successfully.');
                        } else {
                            System.debug('The email failed to send: '
                                    + results[0].errors[0].message);
                            
                        }
                    }
                }
                else {
                    System.debug('khong tim thay BirthDate Email Template');
                }
            }
        } catch (Exception ex) {
            system.debug('Unknown errors: ');
            system.debug('Line======>'+ex.getLineNumber() );
            system.debug('Error======>'+ex.getMessage() );
        }
        
    }
}