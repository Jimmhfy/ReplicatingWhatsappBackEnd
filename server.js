// importing
import express from "express";
import mongoose from "mongoose";
import Messages from './dbMessages.js'
import Pusher from "pusher";
import cors from "cors"

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1368028",
    key: "224a6cf6a619be612ce4",
    secret: "2769012e90a94ba0ba1e",
    cluster: "eu",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url = 'mongodb+srv://admin:FZpaQhZjVSoT7QgC@cluster0.hx2an.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(connection_url,{
            useNewUrlParser: true,
            useUnifiedTopology: true
});

const db = mongoose.connection;
db.once('open',()=>{
    console.log('DB connected');
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log('A change occured', change);
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('message','inserted',{
                name: messageDetails.name,
                message: messageDetails.message,
                timestramp: messageDetails.timestramp,
                received: messageDetails.received
            })
        }
        else{
            console.log('Error triggering Pusher');
        }
    })
})

// api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res)=>{
   Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
});

app.post('/messages/new', (req, res)=>{
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(201).send(data)
        }
    })
});

// listen
app.listen(port,()=>console.log(`listening on localhost:${port}`));

