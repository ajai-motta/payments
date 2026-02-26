
import express, { Request, Response } from "express";
import { currentUser } from "@ajaisgtickets/common";
import cookieSession from "cookie-session";

import { errorHandler } from "@ajaisgtickets/common";
//@ts-ignore
import { NotFoundError } from "@ajaisgtickets/common";
const app = express();


// trust traffic even though its comming from proxy  
app.set('trust proxy',true)//trust ingress-nginx
//parse content
app.use(express.json());
//cookie, remember content is a jwt so no encryption on cookie ////to all
app.use(cookieSession({
  signed: false,
  secure: process.env.NODE_ENV!=='test',// From https or not based on test env
}))
console.log('current user')
app.use(currentUser)
//very critical bug



app.all('/{*splat}', async(req,res) => {
  console.log(req.url)
  console.log('route not found in /spat')
  throw new NotFoundError()
});
app.use(errorHandler)

export {app}