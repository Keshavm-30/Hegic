import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { time } from "console";

//import { mineBlocks, expandTo18Decimals } from "./utilities/utilities";

import { execPath } from "process";
import { Address } from "cluster";
import { ERC20, ERC20Mock, ERC20Mock__factory, ERC20__factory, Exerciser, Facade, Facade__factory, HegicCALL, HegicCALL__factory, HegicPool, HegicPool__factory, HegicPUT, HegicStaking, HegicStaking__factory, OptionsManager, OptionsManager__factory, PriceCalculator, PriceCalculator__factory, PriceProviderMock, PriceProviderMock__factory, UniswapRouterMock, WETHMock, WETHMock__factory } from "../typechain-types";
import { hegicTokenSol, options } from "../typechain-types/contracts";
import { AggregatorV3Interface } from "../typechain-types/contracts/Aggregatorv3interface.sol";
import { Signer } from "ethers";
import { hegicCallSol } from "../typechain-types/contracts/Pool";
import { expandTo18Decimals } from "./utilities/utilities";
import { connect } from "http2";

describe("Factory Testing", function () {
  let signers: SignerWithAddress[];

  let WETH: WETHMock ;
  let Facade : Facade;
  let Exerciser: Exerciser ;
  let ERC20Mock: ERC20Mock;
  let HegicStaking: HegicStaking;
  // let ERC20: ERC20;
  let OptionManager: OptionsManager;
  let PriceProvider: PriceProviderMock;
  let PriceCalculator: PriceCalculator;
  let Aggregator: AggregatorV3Interface;
  let HegicCall: HegicCALL ;
  let HegicPut: HegicPUT;
  let HegicPool: HegicPool;
  let Uniswap: UniswapRouterMock;
  let owner : SignerWithAddress;

  beforeEach("", async () => {
    signers = await ethers.getSigners();
    owner = signers[0];

    ERC20Mock = await new ERC20Mock__factory(owner).deploy("hegictoken","hegictoken",18);
    WETH = await new WETHMock__factory(owner).deploy()
    HegicStaking = await new HegicStaking__factory(owner).deploy(ERC20Mock.address,WETH.address,"hegicStaking","HEGICSTK")
    OptionManager = await new OptionsManager__factory(owner).deploy()
    
    PriceProvider = await  new PriceProviderMock__factory(owner).deploy(789867867800)
    
    HegicCall = await new HegicCALL__factory(owner).deploy(WETH.address,"HegicCall","HegicCall",OptionManager.address,ethers.constants.AddressZero,HegicStaking.address,PriceProvider.address);
    await OptionManager.grantRole("0x985cb37a5a8b8be3316b4239830f14f158762f12abaae14c979a055dd9bbee6f",HegicCall.address);
    // console.log("ROLE=====",await OptionManager.grantRole("",HegicCall.address));
    PriceCalculator = await new PriceCalculator__factory(owner).deploy(70000000000,HegicCall.address,PriceProvider.address);
    await HegicCall.setPriceCalculator(PriceCalculator.address);
    Facade = await new Facade__factory(owner).deploy(WETH.address,OptionManager.address);
    
    });

    describe("provideEthtoPool",async()=>{
      it("only one user adding liquidity",async()=>{
       
        await Facade.poolApprove(HegicCall.address);
        await Facade.provideEthToPool(HegicCall.address,true,0,{value: ethers.utils.parseUnits("10")});
        let owner_ = await HegicCall.ownerOf(0);
        // console.log(owner_);
        let tokenbalance = await HegicCall.balanceOf(owner.address);
        expect(tokenbalance).to.be.eq(1);
        // console.log("details of liquidity provider==",await HegicCall.tranches(0));
     
      })
      it("multiple user adding liquidity",async()=>{
       
        await Facade.poolApprove(HegicCall.address);
        await Facade.provideEthToPool(HegicCall.address,true,0,{value: ethers.utils.parseUnits("10")});
        await Facade.connect(signers[5]).provideEthToPool(HegicCall.address,true,0,{value: ethers.utils.parseUnits("5")});
        await Facade.connect(signers[1]).provideEthToPool(HegicCall.address,false,0,{value: ethers.utils.parseUnits("6")});

        let owner_ = await HegicCall.ownerOf(0);
        // console.log(owner_);
        let tokenbalance = await HegicCall.balanceOf(owner.address);
        expect(tokenbalance).to.be.eq(1);

        // console.log("details of liquidity provider==1",await HegicCall.tranches(0));
        //  console.log("details of liquidity provider==2",await HegicCall.tranches(1));
        //  console.log("details of liquidity provider==3",await HegicCall.tranches(2));
        let providerstate1 = await HegicCall.tranches(0)
      expect(providerstate1.state).to.be.eq(1);
      expect(providerstate1.hedged).to.be.eq(true);
      let providerstate2 = await HegicCall.tranches(1)
      expect(providerstate2.state).to.be.eq(1);
      expect(providerstate2.hedged).to.be.eq(true);
      let providerstate3 = await HegicCall.tranches(2)
      expect(providerstate3.state).to.be.eq(1);
       expect(providerstate3.hedged).to.be.eq(false);
      

      })
  })
  describe("checking balance for hedged and unhedged tranches",async()=>{
    it("hedged",async()=>{
     
      await Facade.poolApprove(HegicCall.address);
      await Facade.provideEthToPool(HegicCall.address,true,0,{value: ethers.utils.parseUnits("5")});
    
      let totalbalance = await HegicCall.availableBalance();
      expect(totalbalance).to.be.eq(expandTo18Decimals(5));

      let  hedgedbalance = await HegicCall.hedgedBalance();
      expect (hedgedbalance).to.be.eq(expandTo18Decimals(5));
    })
    it("hedged",async()=>{
     
      await Facade.poolApprove(HegicCall.address);
      await Facade.provideEthToPool(HegicCall.address,false,0,{value: ethers.utils.parseUnits("10")});
    
      let totalbalance = await HegicCall.availableBalance();
      expect(totalbalance).to.be.eq(expandTo18Decimals(10));
      
      let  unhedgedbalance = await HegicCall.unhedgedBalance();
      expect (unhedgedbalance).to.be.eq(expandTo18Decimals(10));

    })


  })
 
  describe("usertrying to withdraw the liquidity",async()=>{
    it("user trying to withdraw hedgaed liquidity before lockup period ",async()=>{
     
      await Facade.poolApprove(HegicCall.address);
      await Facade.provideEthToPool(HegicCall.address,true,0,{value: ethers.utils.parseUnits("10")});
      
      let  hedgedbalance = await HegicCall.hedgedBalance();
      expect (hedgedbalance).to.be.eq(expandTo18Decimals(10));

      await expect(HegicCall.connect(owner).withdraw(0)).to.be.revertedWith("Pool Error: The withdrawal is locked up");   

    })
    it("user trying to withdraw unhedged liquidity before lockup period",async()=>{
      await Facade.poolApprove(HegicCall.address);
      await Facade.provideEthToPool(HegicCall.address,false,0,{value: ethers.utils.parseUnits("10")});

      let unhedgedbalance = await HegicCall.unhedgedBalance();
      expect (unhedgedbalance).to.be.eq(expandTo18Decimals(10));

      await expect(HegicCall.connect(owner).withdrawWithoutHedge(0)).to.be.revertedWith("Pool Error: The withdrawal is locked up");

    })
    it("user trying to withdraw hedgaed liquidity after lockup period ",async()=>{
     
      await Facade.poolApprove(HegicCall.address);
      await Facade.provideEthToPool(HegicCall.address,true,0,{value: ethers.utils.parseUnits("10")});
      let tokenbalancebefore = await HegicCall.balanceOf(owner.address);
      expect(tokenbalancebefore).to.be.eq(1);
      let  hedgedbalance = await HegicCall.hedgedBalance();
      expect (hedgedbalance).to.be.eq(expandTo18Decimals(10));
      await ethers.provider.send('evm_increaseTime', [5184008]);
      await HegicCall.connect(owner).withdraw(0);
      let balance = await WETH.balanceOf(owner.address);
      expect(balance).to.be.eq(expandTo18Decimals(10)); 
      let ownerstate = await HegicCall.tranches(0)
      expect(ownerstate.state).to.be.eq(2);
      //console.log("detail of liquidity provider after withdraw",await HegicCall.tranches(0));

    })
    it("user trying to withdraw unhedged liquidity after lockup period",async()=>{
      await Facade.poolApprove(HegicCall.address);
      // console.log("WETH balance before provideEthToPool ",await WETH.balanceOf(owner.address));
      
      await Facade.provideEthToPool(HegicCall.address,false,0,{value: expandTo18Decimals(10)});
      // console.log("WETH balance after provideEthToPool ",await WETH.balanceOf(owner.address));

      let unhedgedbalance = await HegicCall.unhedgedBalance();
      expect (unhedgedbalance).to.be.eq(expandTo18Decimals(10));

      await ethers.provider.send('evm_increaseTime', [2592001]);
      // await HegicCall.connect(owner).withdraw(0); 
      await HegicCall.connect(owner).withdrawWithoutHedge(0);
      let balance = await WETH.balanceOf(owner.address);
      expect(balance).to.be.eq(expandTo18Decimals(10)); 
    })

  })
  describe("owner sets max limit of liquidity for hedged and unhedged",async()=>{
    it("adding liquidity to hedged ",async()=>{
      await Facade.poolApprove(HegicCall.address);

      await HegicCall.connect(owner).setMaxDepositAmount(expandTo18Decimals(20),expandTo18Decimals(5));
      await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(5)});
      await expect(Facade.connect(owner).provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(1)})).to.be.revertedWith("Pool Error: Depositing into the pool is not available"); 

    
})
  it("adding liquidity to unhedged ",async()=>{
  await Facade.poolApprove(HegicCall.address);

  await HegicCall.connect(owner).setMaxDepositAmount(expandTo18Decimals(20),expandTo18Decimals(5));
 
  await Facade.provideEthToPool(HegicCall.address,false,0,{value: expandTo18Decimals(20)}); //for unhedged limit is max upto total amount 

})
  it("adding liquidity unhedged ",async()=>{
    await Facade.poolApprove(HegicCall.address);
  
    await HegicCall.connect(owner).setMaxDepositAmount(expandTo18Decimals(20),expandTo18Decimals(5));
   
    await Facade.provideEthToPool(HegicCall.address,false,0,{value: expandTo18Decimals(15)}); //for unhedged limit upto total amount. example if headge is 5 than we can add 15 unhedged
    await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(5)});
    await expect(Facade.connect(owner).provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(1)})).to.be.revertedWith("Pool Error: Depositing into the pool is not available");
    await expect(Facade.connect(owner).provideEthToPool(HegicCall.address,false,0,{value: expandTo18Decimals(1)})).to.be.revertedWith("Pool Error: Depositing into the pool is not available"); 
})
})
  describe("create option ",async()=>{
    it("creating option for sell",async()=>{
      await Facade.poolApprove(HegicCall.address);
      await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(5)});
      await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
      await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));
      let balancebeforecreatingoption = await WETH.balanceOf(signers[5].address);
      expect(balancebeforecreatingoption).to.be.equal(expandTo18Decimals(5));
      await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
      let balanceaftercreatingoption = await WETH.balanceOf(signers[5].address);
      expect(balanceaftercreatingoption).to.be.equal(expandTo18Decimals(5).sub(18));
      
      let optionid = await OptionManager.ownerOf(0);
      expect(optionid).to.be.eq(signers[5].address);

      await HegicCall.options(0);
      // console.log("details of options",await HegicCall.options(0));

      let optiondetails = await HegicCall.options(0);
      expect(optiondetails.state).to.be.eq(1);
    })
})
it("create option for multiple users",async()=>{
  await Facade.poolApprove(HegicCall.address);
  await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));

  await WETH.connect(signers[6]).deposit({value: expandTo18Decimals(10)});
  await WETH.connect(signers[6]).approve(Facade.address,expandTo18Decimals(10));

  let balancebeforecreatingoption1 = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption1).to.be.equal(expandTo18Decimals(5));

  let balancebeforecreatingoption2 = await WETH.balanceOf(signers[6].address);
  expect(balancebeforecreatingoption2).to.be.equal(expandTo18Decimals(10));

  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
  let balanceaftercreatingoption1 = await WETH.balanceOf(signers[5].address);
  expect(balanceaftercreatingoption1).to.be.equal(expandTo18Decimals(5).sub(18));
  // console.log("balance signer5=",await WETH.balanceOf(signers[5].address));

  await Facade.connect(signers[6]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],5000000000000);
  let balanceaftercreatingoption2= await WETH.balanceOf(signers[6].address);
  // console.log("balance signer6=",await WETH.balanceOf(signers[6].address));
  expect(balanceaftercreatingoption2).to.be.equal(expandTo18Decimals(10).sub(18));

  let optionid1 = await OptionManager.ownerOf(0);
  expect(optionid1).to.be.eq(signers[5].address);

  let optionid2 = await OptionManager.ownerOf(1);
  expect(optionid2).to.be.eq(signers[6].address);

  await HegicCall.options(0);
  console.log("details of options1",await HegicCall.options(0));

  await HegicCall.options(1);
  console.log("details of options2",await HegicCall.options(1));

  
})
it("create multiple option for single user",async()=>{
  await Facade.poolApprove(HegicCall.address);
  await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(15)});
  await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(15)});
  await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(15));

  let balancebeforecreatingoption1 = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption1).to.be.equal(expandTo18Decimals(15));

  let balancebeforecreatingoption2 = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption2).to.be.equal(expandTo18Decimals(15));

  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
  let balanceaftercreatingoption1 = await WETH.balanceOf(signers[5].address);
  expect(balanceaftercreatingoption1).to.be.equal(expandTo18Decimals(15).sub(18));
  // console.log("balance signer5=",await WETH.balanceOf(signers[5].address));

  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],5000000000000);
  let balanceaftercreatingoption2= await WETH.balanceOf(signers[5].address);
  // console.log("balance signer5=",await WETH.balanceOf(signers[5].address));
  expect(balanceaftercreatingoption2).to.be.equal(expandTo18Decimals(15).sub(36));

  let optionid = await OptionManager.ownerOf(0);
  expect(optionid).to.be.eq(signers[5].address);

  
})
it("creating option for sell for unhedged",async()=>{
  await Facade.poolApprove(HegicCall.address);
  await Facade.provideEthToPool(HegicCall.address,false,0,{value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));
  let balancebeforecreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption).to.be.equal(expandTo18Decimals(5));
  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
  let balanceaftercreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balanceaftercreatingoption).to.be.equal(expandTo18Decimals(5).sub(18));
  
  let optionid = await OptionManager.ownerOf(0);
  expect(optionid).to.be.eq(signers[5].address);

  await HegicCall.options(0);
  console.log("details of options",await HegicCall.options(0));

  let optiondetails = await HegicCall.options(0);
  expect(optiondetails.state).to.be.eq(1);
})
it("creating option for sell for unhedged",async()=>{
  await Facade.poolApprove(HegicCall.address);
  await Facade.provideEthToPool(HegicCall.address,false,0,{value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));

  await WETH.connect(signers[6]).deposit({value: expandTo18Decimals(10)});
  await WETH.connect(signers[6]).approve(Facade.address,expandTo18Decimals(10));

  let balancebeforecreatingoption1 = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption1).to.be.equal(expandTo18Decimals(5));

  let balancebeforecreatingoption2 = await WETH.balanceOf(signers[6].address);
  expect(balancebeforecreatingoption2).to.be.equal(expandTo18Decimals(10));

  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
  let balanceaftercreatingoption1 = await WETH.balanceOf(signers[5].address);
  expect(balanceaftercreatingoption1).to.be.equal(expandTo18Decimals(5).sub(18));
  // console.log("balance signer5=",await WETH.balanceOf(signers[5].address));

  await Facade.connect(signers[6]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],5000000000000);
  let balanceaftercreatingoption2= await WETH.balanceOf(signers[6].address);
  // console.log("balance signer6=",await WETH.balanceOf(signers[6].address));
  expect(balanceaftercreatingoption2).to.be.equal(expandTo18Decimals(10).sub(18));

  let optionid1 = await OptionManager.ownerOf(0);
  expect(optionid1).to.be.eq(signers[5].address);

  let optionid2 = await OptionManager.ownerOf(1);
  expect(optionid2).to.be.eq(signers[6].address);

  await HegicCall.options(0);
  console.log("details of options1",await HegicCall.options(0));

  await HegicCall.options(1);
  console.log("details of options2",await HegicCall.options(1));

  let optiondetails1 = await HegicCall.options(0);
  expect(optiondetails1.state).to.be.eq(1);

  let optiondetails2 = await HegicCall.options(1);
  expect(optiondetails2.state).to.be.eq(1);
})
it("creating option for sell for unhedged",async()=>{
  await Facade.poolApprove(HegicCall.address);
  await Facade.provideEthToPool(HegicCall.address,false,0,{value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));
  let balancebeforecreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption).to.be.equal(expandTo18Decimals(5));
  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
  let balanceaftercreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balanceaftercreatingoption).to.be.equal(expandTo18Decimals(5).sub(18));
  
  let optionid = await OptionManager.ownerOf(0);
  expect(optionid).to.be.eq(signers[5].address);

  await HegicCall.options(0);
  console.log("details of options",await HegicCall.options(0));

  let optiondetails1 = await HegicCall.options(0);
  expect(optiondetails1.state).to.be.eq(1);

})
describe("exercise",async()=>{
it("exercise for hedged create option",async()=>{
  await Facade.poolApprove(HegicCall.address);
  await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));
  let balancebeforecreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption).to.be.equal(expandTo18Decimals(5));
  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
  let balanceaftercreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balanceaftercreatingoption).to.be.equal(expandTo18Decimals(5).sub(18));
  
  let optionid = await OptionManager.ownerOf(0);
  expect(optionid).to.be.eq(signers[5].address);

  await HegicCall.options(0);
  console.log("details of options",await HegicCall.options(0));

  let optiondetails1 = await HegicCall.options(0);
  expect(optiondetails1.state).to.be.eq(1);

  // console.log("details of options",await HegicCall.options(0));
  await expect(Facade.exercise(0)).to.be.revertedWith("Facade Error: _msgSender is not eligible to exercise the option");
  // await Facade.connect(signers[5]).exercise(0);

  
})
it("exercising with increase in price and checking state",async()=>{
  await Facade.poolApprove(HegicCall.address);
  await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));
  let balancebeforecreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption).to.be.equal(expandTo18Decimals(5));
  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
  let balanceaftercreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balanceaftercreatingoption).to.be.equal(expandTo18Decimals(5).sub(18));
  
  let optionid = await OptionManager.ownerOf(0);
  expect(optionid).to.be.eq(signers[5].address);

  await HegicCall.options(0);
  console.log("details of options",await HegicCall.options(0));

  let optiondetails1 = await HegicCall.options(0);
  expect(optiondetails1.state).to.be.eq(1);

  // console.log("details of options",await HegicCall.options(0));
  await PriceProvider.setPrice(909867867800);
// console.log("================",await PriceProvider.setPrice(909867867800));
  await HegicCall.connect(signers[5]).exercise(0);

  let optiondetails2 = await HegicCall.options(0);
  expect(optiondetails2.state).to.be.eq(2);

})
it("exercising the option after the expiry",async()=>{
  await Facade.poolApprove(HegicCall.address);
  await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
  await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));
  let balancebeforecreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balancebeforecreatingoption).to.be.equal(expandTo18Decimals(5));
  await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
  let balanceaftercreatingoption = await WETH.balanceOf(signers[5].address);
  expect(balanceaftercreatingoption).to.be.equal(expandTo18Decimals(5).sub(18));
  
  let optionid = await OptionManager.ownerOf(0);
  expect(optionid).to.be.eq(signers[5].address);

  await HegicCall.options(0);
  // console.log("details of options",await HegicCall.options(0));

  let optiondetails1 = await HegicCall.options(0);
  expect(optiondetails1.state).to.be.eq(1);

  // console.log("details of options",await HegicCall.options(0));
  // await HegicCall.unlock(0);
  await PriceProvider.setPrice(900986786780);
  await OptionManager.isApprovedOrOwner(signers[5].address,0);
  await ethers.provider.send('evm_increaseTime',[8640000]);
  await expect(HegicCall.connect(signers[5]).exercise(0)).to.be.revertedWith("Pool Error: The option has already expired");
  await HegicCall.unlock(0);

  
 
  // let optiondetails2 = await HegicCall.options(0);

  // console.log("options deatials=",optiondetails2);
  // expect(optiondetails2.state).to.be.eq(2);

})

})
// it("exercising the option after the expiry",async()=>{
//   await Facade.poolApprove(HegicCall.address);
//   await Facade.provideEthToPool(HegicCall.address,true,0,{value: expandTo18Decimals(5)});
//   await WETH.connect(signers[5]).deposit({value: expandTo18Decimals(5)});
//   await WETH.connect(signers[5]).approve(Facade.address,expandTo18Decimals(5));
//   let balancebeforecreatingoption = await WETH.balanceOf(signers[5].address);
//   expect(balancebeforecreatingoption).to.be.equal(expandTo18Decimals(5));
//   await Facade.connect(signers[5]).createOption(HegicCall.address,6912000,1000,0,[WETH.address],1000000000000);
//   let balanceaftercreatingoption = await WETH.balanceOf(signers[5].address);
//   expect(balanceaftercreatingoption).to.be.equal(expandTo18Decimals(5).sub(18));
  
//   let optionid = await OptionManager.ownerOf(0);
//   expect(optionid).to.be.eq(signers[5].address);

//   await HegicCall.options(0);
//   // console.log("details of options",await HegicCall.options(0));

//   let optiondetails1 = await HegicCall.options(0);
//   expect(optiondetails1.state).to.be.eq(1);

//   // console.log("details of options",await HegicCall.options(0));
//   // await HegicCall.unlock(0);
//   await PriceProvider.setPrice(900986786780);
//   await OptionManager.isApprovedOrOwner(signers[5].address,0);
//   await ethers.provider.send('evm_increaseTime',[8640000]);
//   await expect(HegicCall.connect(signers[5]).exercise(0)).to.be.revertedWith("Pool Error: The option has already expired");
//   await HegicCall.unlock(0);
// })



})