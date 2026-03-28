import { Subjects,Publisher,paymentCreatedEvent } from "@ajaisgtickets/common";

export class PaymentCreatedPublisher extends Publisher<paymentCreatedEvent>{
    subject: Subjects.PaymentCreated=Subjects.PaymentCreated;
    
}