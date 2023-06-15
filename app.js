const express =require('express');
const app =express();
const bodyParser =require('body-parser');
const morgan =require('morgan');
const mongoose =require('mongoose');
const { strict } = require('assert');
const cors =require('cors');


require('dotenv/config');
const authJwt =require('./helpers/jwt');
const errorHandler =require('./helpers/error-handler');


app.use(cors());
app.options('*',cors());

const productsRouter =require('./routes/products');



//middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
//app.use(errorHandler);   


//Routers

const categoriesRoutes =require('./routes/categories');
const productsRoutes =require('./routes/products');
const usersRoutes =require('./routes/users');
const ordersRoutes =require('./routes/orders');




const api = process.env.API_URL;

const Product =require('./models/product');
//const authJwt = require('./helpers/jwt');
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);



mongoose.connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName:'eshop1-database'
})
.then(() =>{
    console.log('Database Connection is ready..!');
})
.catch((err) =>{
    console.log(err);
})

app.listen(3000, () => {
    
    console.log('server is running http://localhost:3000');
})