global with sharing class FURU_HappyBirthDaySchedule implements Schedulable {
    global void execute(SchedulableContext scx) {
        Id batchId = Database.executeBatch(new FURU_HappyBirthDayBatch());
    }
}