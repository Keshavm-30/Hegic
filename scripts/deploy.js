const BN = require("ethers").BigNumber;
const { Signer } = require("ethers");
const { ethers } = require("hardhat");

async function main() {
  
   const [user1,user2,user3] = await ethers.getSigners();
   const owner = Signer[0];

  hegic = await ethers.getContractFactory("ERC20Mock");
  weth = await ethers.getContractFactory("WETHMock");
  stake = await ethers.getContractFactory("HegicStaking");
  manager = await ethers.getContractFactory("OptionsManager");
  provider = await ethers.getContractFactory("PriceProviderMock");
  calculator = await ethers.getContractFactory("PriceCalculator");
  facade = await ethers.getContractFactory("Facade");
  hegiccal = await ethers.getContractFactory("HegicCALL");

  hegic_contract = await hegic.deploy("hegictoken","hegictoken",18);

  console.log("hegictoken_address", hegic_contract.address);

  weth_contract = await weth.deploy();
  console.log("weth_Address ", weth_contract.address);

  stake_contract = await stake.deploy(hegic_contract.address,weth_contract.address,"hegicStaking","HEGICSTK");
  console.log("stake_address", stake_contract.address);

  manager_contract = await manager.deploy();
  console.log("optionamanger_address", manager_contract.address);



  priceprovider_contract = await provider.deploy(789867867800);
  console.log("priceprovider_address", manager_contract.address);

  hegicall_contract = await hegiccal.deploy(weth_contract.address,"hegicoption","hegicoption",manager_contract.address,"0x0000000000000000000000000000000000000000",stake_contract.address,priceprovider_contract.address);
  console.log("hegicall_address", hegicall_contract.address);

  calculator_contract = await calculator.deploy(700000000,hegicall_contract.address,priceprovider_contract.address);
  console.log("pricecalculator_address", calculator_contract.address);

  await hegicall_contract.setPriceCalculator(calculator_contract.address);
  await manager_contract.grantRole("0x985cb37a5a8b8be3316b4239830f14f158762f12abaae14c979a055dd9bbee6f",hegicall_contract.address);

  facade_contract = await facade.deploy(weth_contract.address,manager_contract.address);
  console.log("facade_address", facade_contract.address);


}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

//npx hardhat run scripts/deploy.js --network mumbaitestnet
//npx hardhat run scripts/verify.js --network mumbaitestnet

// usdt 0xb846a5E761287F85e3AB144EF5b94cEF203Fe894
// paaza  0x7c74890C4f3A32579D730e61E2Db4A79C1398e7A
// loanNft 0x6CEE4D7Bd1bC878093E7Aa451CA8919595d8BC90
// pool 0x4C3c170bCb125D495c2aFda8810947A1cAb081dd
// factory 0xB7C3ccE6543C8b7BFa7352D6f339CE00Cc08EaE4