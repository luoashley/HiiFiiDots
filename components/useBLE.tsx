/* eslint-disable no-bitwise */
import {useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';
import {PERMISSIONS, requestMultiple} from 'react-native-permissions';
import DeviceInfo, { getCarrier } from "react-native-device-info";

import {atob, btoa} from 'react-native-quick-base64';

const HEART_RATE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';

// pokemon new code
const POKEMON_SERVICE_UUID = 'D78A31FE-E14F-4F6A-A107-790AB0D58F27';
const POKEMON_SERVICE_CHARACTERISTIC = 'EBE6204C-C1EE-4D09-97B8-F77F360F7372';

const bleManager = new BleManager();

type VoidCallback = (result: boolean) => void;

interface BluetoothLowEnergyApi {
  requestPermissions(cb: VoidCallback): Promise<void>;
  scanForPeripherals(): void;
  connectToDevice: (deviceId: Device) => Promise<void>;
  disconnectFromDevice: () => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  // not in pokemon code
  heartRate: number;
  // pokemon new code
  yourParty: Pokemon[];
  billsPC: Pokemon[];
  exchangePokemon(
    device: Device,
    index: BigInt,
    operation: number,
  ): Promise<void>;
  exchangeError: BleError | null;
}

// pokemon new code
export interface Pokemon {
  opCode: BigInt;
  pokemonIndex: BigInt;
}
export enum POKEMON_STATE {
  TRAINER = 1,
  PC = 2,
}
const startingParty: Pokemon[] = [
  {
    opCode: BigInt(POKEMON_STATE.TRAINER),
    pokemonIndex: BigInt(151),
  },
  {
    opCode: BigInt(POKEMON_STATE.TRAINER),
    pokemonIndex: BigInt(150),
  },
  {
    opCode: BigInt(POKEMON_STATE.TRAINER),
    pokemonIndex: BigInt(149),
  },
  {
    opCode: BigInt(POKEMON_STATE.TRAINER),
    pokemonIndex: BigInt(145),
  },
  {
    opCode: BigInt(POKEMON_STATE.TRAINER),
    pokemonIndex: BigInt(143),
  },
  {
    opCode: BigInt(POKEMON_STATE.TRAINER),
    pokemonIndex: BigInt(130),
  },
];

function useBLE(): BluetoothLowEnergyApi {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [heartRate, setHeartRate] = useState<number>(0);

  // pokemon new code
  const [yourParty, setYourParty] = useState<Pokemon[]>(startingParty);
  const [billsPC, setBillsPc] = useState<Pokemon[]>([]);
  const [exchangeError, setExchangeError] = useState<BleError | null>(null);

  const requestPermissions = async (cb: VoidCallback) => {
    if (Platform.OS === 'android') {
      const apiLevel = await DeviceInfo.getApiLevel();

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth Low Energy requires Location',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        cb(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await requestMultiple([
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ]);

        const isGranted =
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;

        cb(isGranted);
      }
    } else {
      cb(true);
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex(device => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }

      // if (device && device.name?includes("Bill's PC") ||
      // device.localName?.includes("Bill's PC"))
      if (device && device.name?.includes('HiFiDots')) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      startStreamingData(deviceConnection);
    } catch (e) {
      console.log('FAILED TO CONNECT', e);
    }
  };

  const disconnectFromDevice = () => {
    if (connectedDevice) {
      bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);

      // Not included in pokemon code
      setHeartRate(0);
    }
  };

  // Not included in pokemon code
  const onHeartRateUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    if (error) {
      console.log(error);
      return -1;
    } else if (!characteristic?.value) {
      console.log('No Data was recieved');
      return -1;
    }
    const rawData = atob(characteristic.value);
    let innerHeartRate: number = -1;
    const firstBitValue: number = Number(rawData) & 0x01;
    if (firstBitValue === 0) {
      innerHeartRate = rawData[1].charCodeAt(0);
    } else {
      innerHeartRate =
        Number(rawData[1].charCodeAt(0) << 8) +
        Number(rawData[2].charCodeAt(2));
    }
    setHeartRate(innerHeartRate);
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      device.monitorCharacteristicForService(
        HEART_RATE_UUID,
        HEART_RATE_CHARACTERISTIC,
        (error, characteristic) => onHeartRateUpdate(error, characteristic),
      );
    } else {
      console.log('No Device Connected');
    }
  };

  // Tutorial Methods Start ======== Send and receive data part code
  // 10 digits: 2 (state of the pokemon) + 8 (pokemon id)

  // decipher the 10-digit ints to actual values
  const encodeExchangeRequest = (exchangePokemon: Pokemon[]) => {
    let rawData = BigInt(0);
    let byteArrayOffset = 0;
    for (let pokemon of exchangePokemon){
      byteArrayOffset += 8;
      const opCode = pokemon.opCode.valueOf() << BigInt(byteArrayOffset);

      const pokedexCode =
        pokemon.pokemonIndex.valueOf() << BigInt(byteArrayOffset - 8);const fullCode = opCode | pokedexCode;
      rawData = rawData | fullCode;
      byteArrayOffset += 2;
    }
    return rawData;
  }

  const exchangePokemon = async (
    device: Device,
    index: BigInt,
    operation: number,
  ) => {
    const allPokemon = [...yourParty, ...billsPC];

    allPokemon.sort((a,b) =>
      Number(a.pokemonIndex.valueOf() - b.pokemonIndex.valueOf()),
    );
    const targetIndex = allPokemon.findIndex(poke => {
      return poke.pokemonIndex === index;
    });
    allPokemon[targetIndex].opCode = BigInt(operation);

    const request = encodeExchangeRequest(allPokemon);
    setExchangeError(null);
    try {
      await bleManager.writeCharacteristicWithResponseForDevice(
        device.id,
        POKEMON_SERVICE_UUID,
        POKEMON_SERVICE_CHARACTERISTIC,
        btoa(`${request}`),
      )
    }catch (e){
      console.log(e);
    }
  }

  // get the bits back from the PC
  const extractBit = (target: BigInt, startBit: BigInt, endBit: BigInt) => {
    const mask =
      ((BigInt(1) << endBit.valueOf()) - BigInt(1)) << startBit.valueOf();

    return mask & target.valueOf();
  };

  // turn the raw bits back into pokemon objects
  const deserializeData = (data: string) => {
    const kPokeIndexLength = 8;
    const kOpcodeLength = 2;
    const allPokemon: Pokemon[] = [];

    // convert data into bigInt
    let allData = BigInt(data);
    let i = 0;

    // 6 pokemon of 10 bits each
    while (i < 60) {
      const pokemonIndex =
        extractBit(allData, BigInt(i), BigInt(kPokeIndexLength)) >> BigInt(i);

      const opCode =
        extractBit(
          allData,
          BigInt(i + kPokeIndexLength),
          BigInt(kOpcodeLength),
        ) >> BigInt(i + kPokeIndexLength);

      allPokemon.push({
        opCode,
        pokemonIndex,
      });

      i += 10;
    }

    return allPokemon;
  };

  const onPokemonPartyUpdated = (
    error: BleError | null,
    characteristic: Characteristic | null,
  ) => {
    const rawData = atob(characteristic?.value ?? '');
    const newPokemon = deserializeData(rawData);

    if (error) {
      setExchangeError(error);
      return;
    }

    const filterPokemon = newPokemon.filter(
      pokemon => pokemon.opCode !== BigInt(POKEMON_STATE.PC),
    );

    const filterPC = newPokemon.filter(
      pokemon => pokemon.opCode === BigInt(POKEMON_STATE.PC),
    );

    setYourParty(filterPokemon);
    setBillsPc(filterPC);
  };






  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,

    // Not in pokemon
    heartRate,

    // Pokemon code
    billsPC,
    yourParty,
    exchangeError,
    exchangePokemon,

  };
}

export default useBLE;
