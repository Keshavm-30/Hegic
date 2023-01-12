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
  hegicput = await ethers.getContractFactory("HegicPUT");

  hegic_contract = await hegic.deploy("hegictoken","hegictoken",18);

  console.log("hegictoken_address", hegic_contract.address);

  weth_contract = await weth.deploy();
  console.log("weth_Address ", weth_contract.address);

  stake_contract = await stake.deploy(hegic_contract.address,weth_contract.address,"hegicStaking","HEGICSTK");
  console.log("stake_address", stake_contract.address);

  manager_contract = await manager.deploy();
  console.log("optionamanger_address", manager_contract.address);



  priceprovider_contract = await provider.deploy(789867867800);
  console.log("priceprovider_address", priceprovider_contract.address);

  hegicput_contract = await hegicput.deploy(weth_contract.address,"hegicoption","hegicoption",manager_contract.address,"0x0000000000000000000000000000000000000000",stake_contract.address,priceprovider_contract.address,18);
  console.log("hegicput_address", hegicput_contract.address);

  calculator_contract = await calculator.deploy(700000000,hegicput_contract.address,priceprovider_contract.address);
  console.log("pricecalculator_address", calculator_contract.address);

  await hegicput_contract.setPriceCalculator(calculator_contract.address);
  await manager_contract.grantRole("0x985cb37a5a8b8be3316b4239830f14f158762f12abaae14c979a055dd9bbee6f",hegicput_contract.address);

  facade_contract = await facade.deploy(weth_contract.address,manager_contract.address);
  console.log("facade_address", facade_contract.address);


}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


//npx hardhat run scripts/verify.js --network mumbaitestnet
