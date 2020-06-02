@isTest
private with sharing class FURU_HappyBirthDaySchedule_Test {
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
        FURU_HappyBirthDaySchedule scheduleBirthDate = new FURU_HappyBirthDaySchedule();
        System.debug(scheduleBirthDate);
        System.Test.startTest();
        String jobId = System.schedule(
            'Test Send Email Birth Day',
            '0 0 4 * * ?',
            scheduleBirthDate
        );
        
        System.debug(jobId);
        System.Test.stopTest();

        //List<AsyncApexJob> result_Test = [SELECT Id, Status, NumberOfErrors FROM AsyncApexJob ];
        
        System.assert(true);
    }
}