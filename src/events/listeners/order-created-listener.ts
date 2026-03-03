import { Listener,OrderCreatedEvent, OrderStatus, Subjects } from "@ajaisgtickets/common";
import { queGroupName } from "./queue-group-listener";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";


export class OrderCreatedListener extends Listener<OrderCreatedEvent>{
    subject: Subjects.OrderCreated=Subjects.OrderCreated;
    queueGroupName=queGroupName;
   async onMessage(data: { id: string; status: OrderStatus; version: number; userId: string; expiresAt: string; ticket: { id: string; price: number; }; }, msg: Message){
        const order=Order.build({id: data.id,status: data.status,version: data.version,userId: data.userId,price: data.ticket.price})
        await order.save()
        msg.ack()
    }
}