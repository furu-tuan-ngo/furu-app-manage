global with sharing class FURU_HappyBirthDayBatch implements Database.Batchable<SObject>{
    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            'SELECT FirstName, LastName, Email, Birthdate FROM Contact LIMIT 50000'
        );
    }
    global void execute(Database.BatchableContext bc, List<Contact> cons){
        List<Contact> contacts = new List<Contact>();
        
        for(Contact con : cons) {
            if(this.isEmployeeBirthDate(con)) {
                contacts.add(con);
            }
        }
        System.debug(contacts);
        FURU_SenMail.send(contacts);
    }

    global void finish(Database.BatchableContext bc){
        
    }   

    private Boolean isEmployeeBirthDate(Contact con) {
        Date nowDay = Date.today();     
        return con.Birthdate != null 
                && con.Birthdate.month() == nowDay.month() 
                && con.Birthdate.day() == nowDay.day();
    }
}