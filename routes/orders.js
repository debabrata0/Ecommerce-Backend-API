const {Order} =require('../models/order');
const express = require('express');
const { OrderItem } =require('../models/order-item');
const router =express.Router();

router.get(`/`,async (req, res) =>{
    const orderList =await Order.find().populate('user' , 'name').sort({'dateOrdered':-1});

    if(!orderList) {
        res.status(500).json({success:false});
    }
    res.send(orderList);
})

router.get(`/:id`,async (req, res) =>{
    const order =await Order.findById(req.params.id)
    .populate('user' , 'name')
    .populate({
        path: 'orderItems' , populate:{
            path:'product' , populate:'category'}
        });

    if(!order) {
        res.status(500).json({success:false});
    }
    res.send(order);
})


router.post('/',async (req,res) =>{

    const orderItemsIds = Promise.all(req.body.orderItemsIds.map(async orderItem =>{
        let newOrderItem =new OrderItem({
         quantity:orderItem.quantity,
         product:OrderItem.product
        })

        newOrderItem =await newOrderItem.save();

        return newOrderItem._id;
    }))

    const orderItemsIdsResolved =await orderItemsIds;

    //console.log(orderItemsIdsResolved);

    const totalPrices =await Promise.all(orderItemsIdsResolved.map(async (orderItemsId) =>{
        const orderItem =await OrderItem.findById(orderItemsId).populate('product', 'price');
        const totalPrice =orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }))

    const totalPrice =totalPrices.reduce((a,b) =>a+b ,0);
    console.log(totalPrices);

    let order =new Order( {
       OrderItems:orderItemsIdsResolved,
       shippingAddress1:req.body.shippingAddress1,
       shippingAddress2:req.body.shippingAddress2,
       city:req.body.city,
       zip:req.body.zip,
       country:req.body.city,
       phone:req.body.phone,
       status:req.body.status,
       totalPrice:totalPrice,
       user:req.body.user,
    })
    order =await order.save();

    if(!order)
    return res.status(404).send('The oredr cannot be created!')

    res.send(order);
})

router.put('/:id',async (req,res)=>{
    const order =await Order.findByIdAndUpdate(
        req.params.id,
        {
           status:req.body.status,
        },
        { new:true}
    )
    if(!order)
    return res.status(404).send('The order cannot be created!')

    res.send(order);
})

router.delete('/:id',(req,res)=>{
    Order.findByIdAndRemove(req.params.id).then(async order =>{
        if(order){
            await order.orderItem.map( async orderItem =>{
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, massage:'The order is deleted!'})
        } else {
            return res.status(404).json({success: false , massage: "Order not found!"})
        }
    }).catch(err => {
        return res.status(400).json({success:false ,error:err})
    })
})

router.get('/get/totalsales' ,async (req,res) =>{
    const totalSales =await Order.aggregate([
        { $group : { _id: null , totalSales: {$sum: '$totalPrice'}}}
    ])

    if(!totalSales){
        return res.status(400).send('The order sales connot be generated')
    }
    res.send({totalsales: totalSales.pop().totalsales})
})


router.get(`/get/count`,async (req,res)=>{
    const orderCount =await Order.countDocuments((count) => count)

    if(!orderCount){
        res.status(500).json({success:false})
    }
     res.send({
        orderCount:orderCount
     });
})

router.get(`/get/userorders/:userid`,async (req, res) =>{
    const userOrderList =await Order.find({user:req.params.userid}). populate({
        path: 'orderItems' , populate:{
            path:'product' , populate:'category'}
        }).sort({'dateOrdered':-1});

    if(!userOrderList) {
        res.status(500).json({success:false});
    }
    res.send(userOrderList);
})

module.exports=router;