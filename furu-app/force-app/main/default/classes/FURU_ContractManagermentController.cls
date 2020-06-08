public with sharing class FURU_ContractManagermentController {
    //private static final Decimal EX_RATE = Decimal.valueOf(System.Label.furu_ContractDetailFormExchangeRate);
    @AuraEnabled
    public static List<Resouce> getResources(){
        List<Resouce> resources = new List<Resouce>();

        for (Account acc : getAllAccounts()) {
            String recordType = acc.recordType != null ? acc.recordType.DeveloperName : null;
            resources.add(new Resouce(
                acc.Id,
                acc.Name,
                recordType
            ));
        }
        return resources;
    }

    @AuraEnabled
    public static List<Event> getEvents(Integer year){
        List<Event> events = new List<Event>();
        for (Contract contract : getAllContract(year)) {
            Map <String, String> mapMonthApiName = getMapMonthAndExrateApiName();
            Integer monthIndex = 1;
            for (String monthApiName: mapMonthApiName.keySet()){
                Decimal monthValue = (Decimal)contract.get(monthApiName);
                Decimal exrateValue = (Decimal)contract.get(mapMonthApiName.get(monthApiName));
                if (monthValue != null){
                    /*Integer month = mapMonthApiName.get(monthApiName); */
                   	Integer month = monthIndex;
                    Integer endDay = daysInMonth(month, year);
                    String startDate = formatDate(Date.newInstance(year, month, 1));
                    String endDate = formatDate(Date.newInstance(year, month, endDay));
                    String income = convertValue(monthValue*exrateValue);
                    events.add(new Event(contract.Id,contract.AccountId, contract.ContractNumber__c, startDate, endDate, monthValue, income));
                }
                monthIndex ++ ;
            }
        }
        return events;
    }

    public class Resouce {
        @AuraEnabled public string id           {get; set;}
        @AuraEnabled public string title        {get; set;}
        @AuraEnabled public string recordType   {get ;set;}
        public Resouce(String resourceId, String resourceTitle, String recordType) {
            this.id = resourceId;
            this.title = resourceTitle;
            this.recordType = recordType;
        }
    }

    public class Event {
        @AuraEnabled public String  id              {get; set;}
        @AuraEnabled public String  resourceId      {get; set;}
        @AuraEnabled public String  title           {get; set;}
        @AuraEnabled public String  start           {get; set;}
        @AuraEnabled public String  finish          {get; set;}
        @AuraEnabled public Decimal value           {get; set;}
        @AuraEnabled public String  income          {get; set;}
        
        public Event(String id ,String resourceId, String title, String startDate, String endDate, Decimal value, String income){
            this.id = id;
            this.resourceId = resourceId;
            this.title = title;
            this.start = formatDate(Date.valueOf(startDate));
            this.finish = formatDate(Date.valueOf(endDate));
            this.value = value;
            this.income = income;
        }
    }

    private static List<Account> getAllAccounts() {
        return [SELECT Id, Name, RecordType.DeveloperName FROM Account];
    }

    public static List<Contract> getAllContract(Integer year) {
        List<String> listFields = new List<String>(getMapMonthAndExrateApiName().keySet());
        listFields.addAll(getMapMonthAndExrateApiName().values());
        listFields.addAll(new List<String>{'Id','AccountId','ContractNumber__c','StartDate','EndDate'});
        String listFieldsString = String.join(listFields, ',');
        String condition = ' (CALENDAR_YEAR(StartDate) =: year OR CALENDAR_YEAR(EndDate) =: year)';
        String queryString = String.format('SELECT {0} FROM Contract WHERE {1}', new String[]{listFieldsString, condition});
        System.debug(Database.query(queryString));
        return Database.query(queryString);
    }
    private static Map<String, String> getMapMonthAndExrateApiName(){
        return new Map<String, String>{'January__c' => 'ExRateM1__c',
                                        'February__c' => 'ExRateM2__c',
                                        'March__c' => 'ExRateM3__c',
                                        'April__c' => 'ExRateM4__c',
                                        'May__c' => 'ExRateM5__c',
                                        'June__c' => 'ExRateM6__c', 
                                        'July__c' => 'ExRateM7__c',
                                        'August__c' => 'ExRateM8__c',
                                        'September__c' =>'ExRateM9__c',
                                        'October__c' => 'ExRateM10__c',
                                        'November__c' => 'ExRateM11__c',
                                        'December__c' => 'ExRateM12__c'
                                        };
    }
    private static String formatDate(Date d) {
        return DateTime.newInstance(
            d.year(), d.month(), d.day()
        ).format('yyyy-MM-dd');
    }
    private static Integer daysInMonth(Integer month, Integer year){
        return 32 - Date.newInstance(year, month, 32).day();
    }
    private static String convertValue (Decimal d) {
        // prepend currency symbol
        Return d.format() + ' VND';
    }
}