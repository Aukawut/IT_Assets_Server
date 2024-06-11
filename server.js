// <----------- import Pakage -------------------->
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer") ;

// <----------- import Controller -------------------->
const AuthController = require("./controller/AuthController");
const ComputerController = require("./controller/ComputerController");
const UserController = require("./controller/UserController");
const LocationController = require("./controller/LocationController");
const DepartmentController = require("./controller/DepartmentController");
const AssetsController = require("./controller/AssetsController");
const StatusAssetController = require("./controller/StatusAssetController");
const DashboardController = require("./controller/DashboardController");
const LicenseController = require("./controller/LicenseController");
const SupplierController = require("./controller/SupplierController");
const AccessoriesController = require("./controller/AccessoriesController");
const PartController = require("./controller/PartController");
const DeliveryController = require("./controller/DeliveryController");

const webTokenMiddleWare = require("./middleware/jwtMiddleWare") ;
const fileUploadMiddleWare = require("./middleware/FileUploadMiddleware");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(file);
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});



app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'))

const AuthInstance = new AuthController() ;
const ComputerInstance = new ComputerController() ;
const UserInstance = new UserController() ;
const LocationInstance = new LocationController() ;
const DepartmentInstance = new DepartmentController() ;
const AssetsInstance = new AssetsController() ;
const StatusInstance = new StatusAssetController() ;
const DashboardInstance = new DashboardController() ;
const LicenseInstance = new LicenseController() ;
const SupplierInstance = new SupplierController() ;
const AccessoriesInstance = new AccessoriesController() ;
const PartInstance = new PartController() ;
const DeliveryInstance = new DeliveryController() ;

const upload = multer({storage:storage})

const JwtMiddleWareInstance = new webTokenMiddleWare() ;
const FileUploadInstance = new fileUploadMiddleWare() ;

const PORT = process.env.PORT;

// Routes
app.post("/login",AuthInstance.loginLdap);

// Computer List
app.get('/computerAll',JwtMiddleWareInstance.adminAuthenticateJWT,ComputerInstance.getComputerAll) ;
app.get('/performanceList',JwtMiddleWareInstance.adminAuthenticateJWT,ComputerInstance.getPerformanceList) ;
app.get('/computerSpec/:sn',JwtMiddleWareInstance.adminAuthenticateJWT,ComputerInstance.getSpecComputer) ;
app.get('/listComputerOS',JwtMiddleWareInstance.adminAuthenticateJWT,ComputerInstance.getListsOSComputer) ;
app.get("/computerImage/:sn",JwtMiddleWareInstance.adminAuthenticateJWT,ComputerInstance.getImageBySN)
app.post('/imageComputer/delete',JwtMiddleWareInstance.adminAuthenticateJWT,ComputerInstance.deleteImageByFile);
app.post("/computer/add",JwtMiddleWareInstance.adminAuthenticateJWT,FileUploadInstance.fileUploadMiddleware,ComputerInstance.addComputer);
app.put("/computer/update/:id",JwtMiddleWareInstance.adminAuthenticateJWT,FileUploadInstance.fileUploadMiddleware,ComputerInstance.updateComputer);

app.delete('/computer/:id',JwtMiddleWareInstance.adminAuthenticateJWT,ComputerInstance.deleteComputer);

//UserRoutes
app.get('/users',UserInstance.getUsers) ;
app.get('/usersFormatForm',UserInstance.getUsersToForm) ;

// Auth Route
app.get('/auth',AuthInstance.authenticateJWT)

// Location Route
app.get("/location",JwtMiddleWareInstance.adminAuthenticateJWT,LocationInstance.getLocation);


//Department Route
app.get("/department",JwtMiddleWareInstance.adminAuthenticateJWT,DepartmentInstance.getDepartment)


// Assets Route
app.get("/assets",JwtMiddleWareInstance.adminAuthenticateJWT,AssetsInstance.getAllAssets)
app.get("/assets/type",JwtMiddleWareInstance.adminAuthenticateJWT,AssetsInstance.getTypeAssets)
app.post("/assets/add",JwtMiddleWareInstance.adminAuthenticateJWT,FileUploadInstance.fileUploadMiddleware,AssetsInstance.addAssets);

//Status Assets Route
app.get("/assets_status",JwtMiddleWareInstance.adminAuthenticateJWT,StatusInstance.getStatus)

//dashboard Route
app.get("/reportAssetsCompare",JwtMiddleWareInstance.adminAuthenticateJWT,DashboardInstance.getReportCompareAssetStock)
app.get("/reportAssetsCompare/:year",JwtMiddleWareInstance.adminAuthenticateJWT,DashboardInstance.getReportCompareAssetStockByYear)
app.get("/getYearOptions",JwtMiddleWareInstance.adminAuthenticateJWT,DashboardInstance.getYearOptions)
app.get("/getTop5Assets",JwtMiddleWareInstance.adminAuthenticateJWT,DashboardInstance.getTop5Assets)
app.get("/getAmountOverview",JwtMiddleWareInstance.adminAuthenticateJWT,DashboardInstance.getAmountOverview)


// License Route 
app.get("/license",JwtMiddleWareInstance.adminAuthenticateJWT,LicenseInstance.getLicense);
app.get("/optionLicenseType",JwtMiddleWareInstance.adminAuthenticateJWT,LicenseInstance.getOptionLicenseType);
app.delete("/delete/lisense/:id",JwtMiddleWareInstance.adminAuthenticateJWT,LicenseInstance.deleteLicense);
app.post("/add/license",JwtMiddleWareInstance.adminAuthenticateJWT,LicenseInstance.addLicense)
app.put("/update/license/:id",JwtMiddleWareInstance.adminAuthenticateJWT,LicenseInstance.updateLicense)
app.put("/toggle/active/:id",JwtMiddleWareInstance.adminAuthenticateJWT,LicenseInstance.toggleActive)


// Supplier Route 
app.get("/supplierList",JwtMiddleWareInstance.adminAuthenticateJWT,SupplierInstance.getSupplierList)


// Accessories Route 
app.get("/accessories/it",JwtMiddleWareInstance.adminAuthenticateJWT,AccessoriesInstance.getAccessories)
app.get("/accessories/type",JwtMiddleWareInstance.adminAuthenticateJWT,AccessoriesInstance.getAccessoriesType)
app.post("/accessories/add",JwtMiddleWareInstance.adminAuthenticateJWT,AccessoriesInstance.saveAccessories)
app.put("/accessories/update/:id",JwtMiddleWareInstance.adminAuthenticateJWT,AccessoriesInstance.updateAccessories)
app.delete("/accessories/delete/:id",JwtMiddleWareInstance.adminAuthenticateJWT,AccessoriesInstance.deleteAccessories)
app.put("/accessories/pick/:partCode",JwtMiddleWareInstance.adminAuthenticateJWT,AccessoriesInstance.pickUpAccessories)

//Part master route
app.get("/partMaster",JwtMiddleWareInstance.adminAuthenticateJWT,PartInstance.getAllPart)
app.get("/sumary/byPart",JwtMiddleWareInstance.adminAuthenticateJWT,PartInstance.sumaryByPart)
app.post("/sparePart/add",JwtMiddleWareInstance.adminAuthenticateJWT,PartInstance.addPart)
app.put("/sparePart/update/:id",JwtMiddleWareInstance.adminAuthenticateJWT,PartInstance.updatePart)
app.delete("/sparePart/delete/:id",JwtMiddleWareInstance.adminAuthenticateJWT,PartInstance.deletePart)

//Delivery Route
app.get("/itemDelivery",JwtMiddleWareInstance?.adminAuthenticateJWT,DeliveryInstance.getEquipment)
app.get("/documentDelivery/:sn",JwtMiddleWareInstance?.adminAuthenticateJWT,DeliveryInstance.getLastDocNo)

// Run server backend
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("Press ctrl + c on Terminal to stop server!");
});
