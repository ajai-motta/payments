import { Listener,OrdercancelledEvent, OrderStatus, Subjects } from "@ajaisgtickets/common";
import { queGroupName } from "./queue-group-listener";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";


export class OrderCancelledListener extends Listener<OrdercancelledEvent>{
    subject: Subjects.Ordercancelled=Subjects.Ordercancelled;
    queueGroupName=queGroupName;
   async onMessage(data: { id: string; version: number; ticket: { id: string; }; }, msg: Message) {
      const order=await Order.findOne({_id: data.id,version: data.version -1}) 
      if(!order){
         throw Error('order not found in order cncelled listener')
      }
      order.set({status: OrderStatus.Cancelled})
      await order.save()
      msg.ack()
   }
}