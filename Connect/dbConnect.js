const mongoose=require('mongoose')

mongoose.connect(process.env.DBCONNECT).then(res=>{
    console.log("DB Connected");
}).catch((err)=>{
    console.log(err);
})