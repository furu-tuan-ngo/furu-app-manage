@isTest
private with sharing class FURU_SenMail_Test {
    @isTest static void sendMail_Test() {
        List<Contact> contacts = new List<Contact>();
        for(Integer i =0; i < 2; i++) {
            contacts.add(
                new Contact(
                    LastName='T'+i,
                    BirthDate= Date.newInstance(2020, 5, 3),
                    Email = 'demo'+i+'@gmail.com'
                )
            );
        }

        insert contacts;

        System.Test.startTest();
        FURU_SenMail.send(contacts);
        Integer invocations  = Limits.getEmailInvocations();
        System.Test.stopTest();

        System.assertEquals(1, invocations);
    }
}