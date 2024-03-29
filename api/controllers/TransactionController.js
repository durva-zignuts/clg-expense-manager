/**
 * TransactionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const ejs = require('ejs');
// const pdf = require('html-pdf');
// const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
// const fs = require('fs-extra');
const {join} = require('path');

//Required package
var pdf = require("pdf-creator-node");
var fs = require("fs");

module.exports = {

    // add transaction Page
    addTransaction : function(req, res){
        // account id through params - so we can add transaction in particular account only
        let _id = req.params._id;
        console.log('98 pgdf',_id);

        // user id through middleware
        let userId = req.userData.userId;

        // finding account through account id
        Account.find({_id}).then(function(docs){
            console.log('one account 767', docs[0]);
            
            res.view('user/addTransaction',{account: docs[0], userId: userId, message: '', err: null});
        });
    },

    // add transaction concept
    addTransact: function(req, res){
        // details got to update
        let types = req.body.types;
        let amount = req.body.amount;
        let date = req.body.date;
        let description = req.body.description;
        console.log('transac body',req.body);

        // transaction id through params
        let _id = req.params._id;
        console.log('transac account id',_id);

        // user id through middleware
        let userId = req.userData.userId;
        console.log('lgjkhg',userId);

        // finding account through account id
        Account.find({_id}, function(err, account){
            console.log('acount id 123', _id);
            console.log('kfhfgh',account);

            if(err) return res.negotiate(err);

            // adding transaction using create 
            const transaction = Transaction.create({
                types: types,
                amount: amount,
                date: date,
                description: description,
                account: _id,
                admin: userId,
            }).fetch().then(result=>{
                console.log('result trnsact',result);
         
                return res.view('user/addTransaction', {message: 'Transaction added successfully', err: '', userId: userId, account: account[0]});
            })
        })
    },

    // view all transactions 
    viewTransaction : async function(req, res){
        // account id through params
        let _id = req.params._id;
        console.log('view account id',_id);

        // user id through middleware
        let userId = req.userData.userId;

        let page = 1;

        if(req.query.page) {
            console.log("in if condition");
            page = req.query.page;
            const limit = 10;

            var transaction = await Account.find({_id}).populate('transactions');
            console.log('tetreg', transaction);
            let results = transaction[0].transactions;
            let count = results.length;
            console.log('count',count);
            count = Math.ceil(count/limit);


            // getting all transaction populating through account
            var transaction = await Account.find({_id}).populate('transactions', {sort: 'createdAt DESC', limit:(limit * 1), skip:((page - 1) * limit)});
            console.log('tetreg', transaction);
            let result = transaction[0].transactions;
            console.log('result',result);

          let balance = 0;
            for(let i=0; i<result.length; i++){
                // console.log('type::::',result[i].types);
                let type = result[i].types;

                switch(type) {
                    case 'Transfer':
                        balance -= result[i].amount;
                        break;

                    case 'Expense':
                        balance -= result[i].amount;
                        break;

                    case 'Income':
                        balance += result[i].amount;
                        break;
                }
            }

            console.log('Balance:::', balance);

            // sorting transaction in descending order
            // result.sort(function(a, b) {
            //     var c = new Date(a.date);
            //     var d = new Date(b.date);
            //     return d-c;
            // })
            console.log('total',count);
            let previous = page - 1;
            console.log('prev',previous);
            let next = (Number(page) + 1);
            console.log('next',next);
            console.log('current page', page);
            // result = result.limit(limit * 1).skip((page - 1) * limit);
            return res.view('user/viewTransaction', {transaction: result, userId: userId, _id: _id, totalPages: count, currentPage:page, previous: page - 1, next: next, balance: balance });

        }
        // else {
        //     console.log("in else condition");

        //     // getting all transaction populating through account
        //     var transaction = await Account.find({_id}).populate('transactions');
        //     console.log('tetreg', transaction);
        //     let result = transaction[0].transactions;

        //     // sorting transaction in descending order
        //     result.sort(function(a, b) {
        //         var c = new Date(a.date);
        //         var d = new Date(b.date);
        //         return d-c;
        //     });

        //     console.log('uydt', transaction[0].transactions);
        //     return res.view('user/viewTransaction', {transaction: result, userId: userId, _id: _id});
        // }
    },

    // delete a transaction concept
    deleteTransaction : async function(req, res){
        try {
            // transaction id through params
            let _id = req.params._id;
            console.log('delete transaction id',_id);
            
            // user id through middleware
            let loggedInUserId = req.userData.userId;
            console.log('ioui',loggedInUserId);

            // finding transaction 
            Transaction.find({_id}).then(async function(docs){
                console.log('one account 767676', docs[0]);

                // if current logged-in user is same as admin user then perform this operation 
                if(loggedInUserId == docs[0].admin){

                    // getting account id 
                    let accountId = docs[0].account;
                    console.log('account id in transaction', accountId);

                    // performing delete operations using removeFromCollection - which comes under many to many to association
                    await Account.removeFromCollection(accountId, 'transactions',_id ).exec(function(err) {
                        if (err) {
                            res.send(500, { error: "Database Error" });
                        }
                        console.log('deleted successfully');
                        });
                        
                    console.log("Deleted");

                    return res.status(200).json({
                        message: 'Deleted'
        
                    })
                }
            });

        } catch (error) {
            console.log(error);
        }
    },

    // update transaction Page
    updateTransaction : function(req, res){
        // getting transaction id through params
        let _id = req.params._id;
        console.log('232pgdfrer',_id);

        // current logged-in user
        let loggedInUserId = req.userData.userId;
        console.log('ioui7868',loggedInUserId);

        // finding transaction 
        Transaction.find({_id}).then(function(docs){
            console.log('6565 one transaction', docs[0]);
            
            // if current logged-in user is same as admin user then perform this operation 
            if(loggedInUserId == docs[0].admin){
                return res.view('user/updateTransaction',{transaction: docs[0], loggedInUserId: loggedInUserId});
            }else{
                // otherwise update button got disabled
                console.log('not allowed');
                return res.view('user/transactionNot',{transaction: docs[0], loggedInUserId: loggedInUserId});
            }
        });
      
    },

    // update transaction concept
    updateTransact : async function(req, res){
        // current user id
        let loggedInUserId = req.userData.userId;

        // getting transaction id using params
        let _id = req.params._id;
        console.log('update transaction id',_id);

        // finding transaction 
        Transaction.find({_id}).then(function(docs){
            console.log('6565 transaction', docs[0].account);
            // console.log(docs[0]);
            // getting account id through trnsaction admin
            let accountId = docs[0].account;
            
            // find current account
            Account.find({_id:accountId}).then(async function(docs){
                console.log('fhfh',docs[0]);

                // getting update data 
                let types = req.body.types;
                console.log('data need to update as',types);
                let amount = req.body.amount;
                console.log('amount', amount);
                let description = req.body.description;
                console.log('description', description);
                console.log('jhjghj',req.body);
            
                // updating transaction data
                var updatedTransaction = await Transaction.update({_id: _id})
                .set({
                    types: types,
                    amount: amount,
                    description: description
                }).fetch();
            
                console.log("Updated succesfully transac", updatedTransaction);
                return res.view('user/updateAccount', {transaction: updatedTransaction, loggedInUserId:loggedInUserId, account: docs[0]});
            })
            
        });
    
    },

    // view graph
    viewgraph: async function(req, res){
        // getting user id
        let userId = req.userData.userId;
        // getting account id
        let _id = req.params._id;
        console.log(_id);
        // populating transaction 
        var transaction = await Account.findOne({_id}).populate('transactions');
        console.log('tetreg', transaction);
        let result = transaction.transactions;
        console.log('iuouw',result);
        res.view('user/viewgraph', {userId: userId, transaction: result})
    },

  // html to pdf generate require things

  downloadPdf: async(req, res) => {
        try{
            const userId = req.userData.userId;

            let _id = req.params._id;
            console.log(_id);
            // populating transaction 
            var transaction = await Account.findOne({_id}).populate('transactions');
            console.log('tetreg', transaction);
            let result = transaction.transactions;
            console.log('iuouw',result);
            const filePathName = path.resolve(__dirname, '../../views/user/htmltopdf.ejs');
            const htmlString = await fs.readFileSync(filePathName, 'utf-8');
            // console.log('gdfhgfh',htmlString);
            
            const data = {
                transaction: result
            }
            // console.log(data);
            const ejsData = ejs.render(htmlString, data);

            // console.log('data',ejsData);
            var options = {
                format: "A3",
                orientation: "portrait",
                border: "10mm",
            };

            var document = {
                html: ejsData,
                data: {
                    transaction: result,
                },
                path: "./outputs.pdf",
              };


            pdf
            .create(document, options)
            .then((response) => {
              
              console.log('file',response);

              const filePath = path.join(response.filename);
                fs.readFile(filePath, (err, file) => {
                    if(err) {
                        console.log(err)
                        return res.status(500).send("Could not download file");
                    }
                    console.log('file1', file);
                    return res.setHeader('Content-Type', 'application/pdf').setHeader('Content-Disposition', 'attachement;filename="transaction.pdf"').send(file);

                })
              // return res.setHeader('Content-Type', 'application/pdf').setHeader('Content-Disposition', 'attachement;filename="transaction.pdf"').send(file);
            })
            .catch((error) => {
              console.error(error);
            });

            // const ejsData = ejs.render(htmlString, data);

        } catch(err) {
            console.log(err.message);
        }
    },

};

