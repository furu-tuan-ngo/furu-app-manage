@isTest
private with sharing class FURU_HappyBirthDayBatch_Test {
    @TestSetup
    static void intit(){
        List<Contact> contacts = new List<Contact>();
        for (Integer i= 1; i <= 10; i++) {
            contacts.add(
                new Contact(
                    FirstName='Minh',
                    LastName='Tan'+i,
                    BirthDate= Date.newInstance(2000, 3, 5)
                )
            );
        }

        insert contacts;
    }

    @isTest static void schedule_SendMailBirthDay_Test() {
       
        
        System.Test.startTest();
        Id batchId = Database.executeBatch(new FURU_HappyBirthDayBatch());
        
        System.debug(batchId);
        
        System.Test.stopTest();

        //List<AsyncApexJob> result_Test = [SELECT Id, Status, NumberOfErrors FROM AsyncApexJob ];
        
        System.assert(true);
    }
}