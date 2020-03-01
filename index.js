//--------------Variables/Constants--------------//
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const session = require('express-session');

mongoose.connect('mongodb://localhost:27017/cmswebsite', {
    useNewUrlParser: true,useUnifiedTopology: true 
});

//--------------DATABASE CONTENT--------------//
const Page = mongoose.model('Page',{
    author: String,
    title: String,
    headingOne: String,
    headingTwo: String,
    content: String,
    MyImage: String
});

const Admin = mongoose.model('Admin',{
    username: String,
    password: String
});

//--------------Server--------------//

var cmsApp = express();

cmsApp.use(bodyParser.urlencoded({extended:false}));
cmsApp.use(bodyParser.json());
cmsApp.use(fileUpload());

cmsApp.set('views', path.join(__dirname, 'views'));
cmsApp.use(express.static(__dirname+'/public'));
cmsApp.set('view engine', 'ejs');

//--------------Session--------------//
cmsApp.use(session({
    secret:'centralCMSAdminControlPage',
    resave: false,
    saveUninitialized: true    
}));

// ------------ INDEX Routes -----------------//

cmsApp.get('/', function(req, res){
    Page.find({}).exec(function(err, Page){
        Header.findOne({type: 'header'}).exec(function(err,Header){
            res.render('index',{Page:Page, Header:Header});
        });
    });
});

// ------------ Login Routes -----------------//

cmsApp.post('/login', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    Admin.findOne({username: username, password: password}).exec(function(err, admin){
        req.session.username = admin.username;
        req.session.userLoggedIn = true;
        res.redirect('/allpage');
    })
});

cmsApp.get('/login', function(req, res){
    if(req.session.userLoggedIn){
        Page.find({}).exec(function(err, Page){
            Header.findOne({type: 'header'}).exec(function(err,Header){
                res.render('login',{Page:Page, Header:Header});
            });
        });
        res.redirect('allpage') 
    }else{
        Page.find({}).exec(function(err, Page){
            Header.findOne({type: 'header'}).exec(function(err,Header){
                res.render('login',{Page:Page, Header:Header});
            });
        });
    }

});

// ------------ Log Out Routes -----------------//

cmsApp.get('/logout', function(req, res){
    Header.findOne({type: 'header'}).exec(function(err,Header){
    req.session.destroy();
    res.render('logout',{Header:Header});
    });
});

// ------------ New Page Routes -----------------//

cmsApp.get('/newpage', function(req, res){
    if(req.session.userLoggedIn){
        Header.findOne({type: 'header'}).exec(function(err, Header){
            res.render('newpage',{Header:Header});
        });
    } else {
        res.redirect('/login');
    }
});

cmsApp.get('/thank', function(req, res){
    Header.findOne({type: 'header'}).exec(function(err, Header){
        res.render('thank',{Header:Header});
    });
});

cmsApp.post('/newpage', function(req, res){
    var MyImage = req.files.MyImage.name;
    var image = req.files.MyImage;
    var imagePath='public/page_images/' + MyImage;
    image.mv(imagePath, function(err){
        console.log(err);
    });

    var author = req.body.author;
    var title = req.body.title;
    var headingOne = req.body.headingOne;
    var headingTwo = req.body.headingTwo;
    var content = req.body.content;
    var myPage = new Page({
        author: author,
        title: title,
        headingOne: headingOne,
        headingTwo: headingTwo,
        content: content,
        MyImage: MyImage
    })
    
    myPage.save().then( () =>{
        console.log('New Page Created');
    });
    Header.findOne({type: 'header'}).exec(function(err, Header){
        res.render('thank',{Header:Header});
    });
});

// ------------ AllPage Routes -----------------//

cmsApp.get('/allpage', function(req, res){
    if(req.session.userLoggedIn){
        Page.find({}).exec(function(err, Page){
            Header.findOne({type: 'header'}).exec(function(err,Header){
                res.render('allpage',{Page:Page, Header:Header});
            });
        });
    } else {
        res.redirect('/login');
    }
});

// ------------ Edit Page Routes -----------------//

cmsApp.get('/edit/:id', function(req, res){
    var id = req.params.id;
    Page.findOne({_id:id}).exec(function(err, Page){
        Header.findOne({type: 'header'}).exec(function(err, Header){
            res.render('edit', {Page: Page, Header:Header})
        })
    });
});

cmsApp.post('/edit/:id', function(req, res){
    var id = req.params.id;
    var MyImage = req.files.MyImage.name;
    var image = req.files.MyImage;
    var imagePath='public/page_images/' + MyImage;
    image.mv(imagePath, function(err){
        console.log(err);
    });

    var author = req.body.author;
    var title = req.body.title;
    var headingOne = req.body.headingOne;
    var headingTwo = req.body.headingTwo;
    var content = req.body.content;
    Page.findOne({_id:id}).exec(function(err, page){
        page.author = author;
        page.title = title;
        page.headingOne = headingOne;
        page.headingTwo = headingTwo;
        page.content = content;
        page.MyImage = MyImage;
        page.save().then( () => {
            console.log('Page Content Updated');
        });
    });
    res.redirect('/allpage');
});

// ------------ Delete Page Routes -----------------//

cmsApp.get('/delete/:id', function(req, res){
    var id = req.params.id;
    Page.findByIdAndDelete({_id:id}).exec(function(err, Page){
        res.redirect('/allpage');
    });
});

// ------------ Edit Header Routes -----------------//

const Header = mongoose.model('Header',{
    type:String,
    mainTitle: String,
    subTitle: String,
    logo: String
});

cmsApp.get('/editheader', function(req, res){
    if(req.session.userLoggedIn){
        Header.findOne({type: 'header'}).exec(function(err, Header){
            res.render('editheader', {Header:Header})
        });
    } else {
        res.redirect('/login');
    }
});

cmsApp.post('/editheader', function(req, res){
    var imageName = req.files.logo.name;
    var image = req.files.logo;
    var imagePath = 'public/logo_images/Logo.jpg';
    image.mv(imagePath, function (err) {
        console.log(err);
    });
    var mainTitle = req.body.mainTitle;
    var subTitle = req.body.subTitle;
    
    var myHeader = new Header({
        type: 'header',
        mainTitle: mainTitle,
        subTitle:subTitle,
        logo: imageName
    });

    var upserData = myHeader.toObject();
    delete upserData._id;

    Header.update({type: 'header'}, upserData, {upsert: true}, function(err){{
        console.log('failed')
    }});
    res.redirect('/editheader');
});

// ------------ Single Page Routes -----------------//

cmsApp.get('/single/:title', function(req, res){
    var title = req.params.title;
    Page.findOne({title:title}).exec(function(err, Page){
        Header.findOne({type: 'header'}).exec(function(err, Header){
            res.render('singlepage', {Page: Page, Header:Header});
        });
    });
});

cmsApp.listen(8080);
console.log('Server started at 8080 for CMS...');