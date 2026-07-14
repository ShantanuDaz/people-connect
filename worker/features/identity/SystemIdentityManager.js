import Autobase from 'autobase';
import Hyperbee from 'hyperbee';
import b4a from 'b4a';

export class SystemIdentityManager {
  constructor(storeInstance, bootstrapKeyHex, currentDeviceKeyHex) {
    this.store = storeInstance;
    this.bootstrapKey = b4a.from(bootstrapKeyHex, 'hex');
    this.currentDeviceKey = currentDeviceKeyHex;
    this.currentEpoch = 1;
    this.isLoggedOut = false;
    this.engine = null;
    this.view = null;
  }

  async startRuntimeEngine() {
    const localInputCore = this.store.get({ name: 'local-input-log', valueEncoding: 'json' });
    await localInputCore.ready();

    this.engine = new Autobase(this.store, this.bootstrapKey, {
      valueEncoding: 'json',
      localInput: localInputCore,
      open: (store) => {
        console.log('OPEN CALLED!');
        const core = store.get({ name: 'linearized-index-view' });
        return new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' });
      },
      
      apply: async (nodes, view, host) => {
        console.log('APPLY CALLED IN SYSTEM IDENTITY MANAGER WITH', nodes.length, 'nodes');
        for (const node of nodes) {
          let op = node.value;
          if (Buffer.isBuffer(op)) {
            try {
              op = JSON.parse(op.toString());
            } catch (e) {
              continue; // Skip malformed JSON
            }
          }

          // Skip if missing operation
          if (!op || !op.type) continue;

          // Process Critical Recovery Bump Overrides
          if (op.type === 'OP_RECOVERY_BUMP') {
            if (op.epoch > this.currentEpoch) {
              this.currentEpoch = op.epoch;

              // Cryptographically isolate the cluster: drop all old device tracks
              for (const activeWriter of host.writers) {
                await host.removeWriter(activeWriter.key);
              }

              // Bind the new cluster runtime authority
              await host.addWriter(b4a.from(op.newInputCoreKey, 'hex'));

              // Reactive Zombie Interception Check
              if (this.currentDeviceKey !== op.newPrimaryDeviceKey) {
                this.isLoggedOut = true; 
                return; // Cease parsing down-level application modifications
              }
            }
            continue;
          }

          // Process Standard Application Events safely
          if (!this.isLoggedOut) {
            // Map OP_ADD_WRITER logic over to Autobase runtime view (only add to Autobase host here to linearize them)
            if (op.type === 'OP_ADD_WRITER' && op.epoch >= this.currentEpoch) {
              await host.addWriter(b4a.from(op.inputCoreKey, 'hex'), { indexer: true });
            }

            if (op.type === 'SET_PROFILE') {
              await view.put('profile', { name: op.name, displayName: op.displayName });
            }

            // Expose further standard applications via extending the apply loop
          }
        }
      }
    });

    await this.engine.ready();
    this.view = this.engine.view;
    return this.engine;
  }

  // Executed ONLY on the recovery hardware
  async processMasterRecovery(masterKeyPair, newDeviceKeyHex, newInputCoreKeyHex) {
    const bootstrapCore = this.store.get({
      key: this.bootstrapKey,
      keyPair: masterKeyPair,
      valueEncoding: 'json'
    });
    await bootstrapCore.ready();

    // The new target epoch level increments beyond the chronological length of the bootstrap file
    const nextEpochLevel = bootstrapCore.length + 1;

    const session = this.store.session();
    const base = new Autobase(session, this.bootstrapKey, {
      valueEncoding: 'json',
      localInput: bootstrapCore
    });
    await base.ready();

    await base.append({
      type: 'OP_RECOVERY_BUMP',
      epoch: nextEpochLevel,
      newPrimaryDeviceKey: newDeviceKeyHex,
      newInputCoreKey: newInputCoreKeyHex,
      timestamp: Date.now()
    });
    
    await base.close();
    await session.close();
  }
}
