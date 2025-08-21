const express=require('express')

const testController=require('../Controllers/testController')

const router=express.Router()

router.get("/webhook", testController.verifyWebhook);
router.post("/webhook", testController.receiveMessage);

router.post('/send-message',testController.startMessage)


module.exports=router