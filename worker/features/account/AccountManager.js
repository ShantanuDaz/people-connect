import Autobase from 'autobase';
import b4a from 'b4a';

export class AccountManager {
  constructor(store, authLedgerPublicKeyHex, devicePublicKeyHex) {
    this.store = store;
    this.authLedgerPublicKeyHex = authLedgerPublicKeyHex;
    this.devicePublicKeyHex = devicePublicKeyHex;
    this.base = null;
  }

  async start() {
    const apply = async (nodes, view, host) => {
      for (const node of nodes) {
        if (node.value.type === 'OP_ADD_WRITER') {
          await host.addWriter(b4a.from(node.value.deviceKey, 'hex'), { indexer: true });
        }
      }
    };

    const bootstrapKey = b4a.from(this.authLedgerPublicKeyHex, 'hex');
    this.base = new Autobase(this.store, bootstrapKey, { apply, valueEncoding: 'json' });

    await this.base.ready();
    console.log(`AccountManager started for Device: ${this.devicePublicKeyHex.substring(0, 8)}...`);
  }

  async updateProfile(newProfileData) {
    if (!this.base) throw new Error("AccountManager not started");
    await this.base.append({
      type: 'OP_UPDATE_PROFILE',
      profile: newProfileData,
      timestamp: Date.now()
    });
  }

  async deleteAccount() {
    if (!this.base) throw new Error("AccountManager not started");
    await this.base.append({
      type: 'OP_DELETE_ACCOUNT',
      timestamp: Date.now()
    });
  }

  async close() {
    if (this.base) {
      await this.base.close();
    }
  }
}
