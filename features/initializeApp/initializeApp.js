import {
  getLocalProfile,
  createAccount,
  saveLocalProfile,
} from "./createAccount.js";

const InitializeApp = async (rl) => {
  const action = await rl.question("Do you want to (l)ogin or (c)reate a new account? ");

  if (action.toLowerCase().startsWith('l')) {
    const name = await rl.question("What is your account name? ");
    console.log("Checking your profile...");
    
    const profile = await getLocalProfile(name);
    
    if (profile) {
      console.log(`Hi ${profile.name}!`);
      return profile;
    } else {
      console.log("Profile not found.");
      return null;
    }
  } else if (action.toLowerCase().startsWith('c')) {
    const name = await rl.question("What is your name? ");
    console.log("Generating your keys, please wait...");
    const account = createAccount();
    await saveLocalProfile(name, account.mnemonic, account.publicKey);
    console.log("Account created successfully!");
    console.log(`Your Public Key (ID): ${account.publicKey}`);
    return { name, mnemonic: account.mnemonic, pubKey: account.publicKey };
  } else {
    console.log("Invalid option.");
    return null;
  }
};

export default InitializeApp;
