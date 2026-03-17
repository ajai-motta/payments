import Razorpay from "razorpay";
export const razorpay=new Razorpay({
    key_id: "rzp_test_SRv8aPJ4MeI1ox",
    key_secret: process.env.RAZOR_KEY,
    

})