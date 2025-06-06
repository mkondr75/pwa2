// Получение ссылок на элементы UI
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
// Кэш объекта выбранного устройства
let deviceCache = null;
// Кэш объекта характеристики
let characteristicCache = null;
let writecharacter = 0;

// Промежуточный буфер для входящих данных
let readBuffer = '';

// Подключение к устройству при нажатии на кнопку Connect
connectButton.addEventListener('click', function () {
  connect();
});

// Отключение от устройства при нажатии на кнопку Disconnect
disconnectButton.addEventListener('click', function () {
  disconnect();
});

// Обработка события отправки формы
sendForm.addEventListener('submit', function (event) {
  event.preventDefault(); // Предотвратить отправку формы
  send(inputField.value); // Отправить содержимое текстового поля
  inputField.value = '';  // Обнулить текстовое поле
  inputField.focus();     // Вернуть фокус на текстовое поле
});


// Запустить выбор Bluetooth устройства и подключиться к выбранному
function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
    requestBluetoothDevice()).
    then(device => connectDeviceAndCacheCharacteristic(device)).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}
////////////////////function requestBluetoothDevice()
/*
let [connected, setConnected] = useState < string | null > (null)
//async function requestBluetoothDevice()
{
  // Connect Device
  // @ts-ignore
  device = await navigator.bluetooth.requestDevice(
    {
      filters: [{
        name: 'CH9143BLE2U',
        services: ["0000fff0-0000-1000-8000-00805f9b34fb"]
      }],
    }
  );
  server = await device.gatt.connect();
  setConnected('CH9143BLE2U')
  service = await server.getPrimaryService(
    '0000fff0-0000-1000-8000-00805f9b34fb'
  );
  characteristic = await service.getCharacteristic(
    '0000fff1-0000-1000-8000-00805f9b34fb'
  );
  var thing = await characteristic.readValue();
  var decoder = new TextDecoder("utf-8");
  // TODO : send something to the ESP
  var encoder = new TextEncoder();
  characteristic.writeValue(encoder.encode("gday"));
}*/
////////////////////
//return Promise.resolve(characteristicCache);
// Запрос выбора Bluetooth устройства
function requestBluetoothDevice() {
  // log('Requesting bluetooth device...');
  // if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
  //   alert("Your device does not support the Web Bluetooth API. Try again on Chrome on Desktop or Android!");
  // }
  // else {
  //   //in this example, we'll simply allow connecting to any device nearby
  //   //in a real-life example, you'll probably want to use filter so that your app only connects to certain types of devices (e.g. a heart rate monitor)
  //   //more on this here: https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice
  //   let device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
  //   alert("Successfully connected to " + device.name);
  // } //0000fff0-0000-1000-8000-00805f9b34fb name CH9143BLE2U
  return navigator.bluetooth.requestDevice({
    //filters: [{ services: ['0000fff0-0000-1000-8000-00805f9b34fb', '0000fee1-0000-1000-8000-00805f9b34fb'] }],//0xFFE0
    //acceptAllDevices: true
    //optionalService: ['0000fff0-0000-1000-8000-00805f9b34fb']
    filters: [{
      name: 'CH9143BLE2U',
      //services: [0xfff0, 0x1801]
    }],
    // optionalService: ['0000fff0-0000-1000-8000-00805f9b34fb', "00001801-0000-1000-8000-00805f9b34fb"]
    optionalServices: [0xfff0]

  }).
    then(device => {
      log('"' + device.name + '" bluetooth device selected\n');
      deviceCache = device;
      deviceCache.addEventListener('gattserverdisconnected',
        handleDisconnection);
      return deviceCache;
    });

}

// Обработчик разъединения
function handleDisconnection(event) {
  let device = event.target;

  log('"' + device.name +
    '" bluetooth device disconnected, trying to reconnect...');

  connectDeviceAndCacheCharacteristic(device).
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}

// Подключение к определенному устройству, получение сервиса и характеристики
function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCache) {
    return Promise.resolve(characteristicCache);
  }

  log('Connecting to GATT server...');

  return device.gatt.connect().
    then(server => {
      log('GATT server connected, getting service...');
      let a = Promise.resolve(server.getPrimaryServices());
      // let a = server.getPrimaryServices();
      // return a;
      //.then(service => {this.service = service;console.log(service);return Promise.all([
      //this._cacheCharacteristic(service,''),])
      // return server.getPrimaryService("0000fff0-0000-1000-8000-00805f9b34fb");//0xFFF0
      return a;//server.getPrimaryService(0xfff0);//0xFFF0
      // return server?.getPrimaryServices();
    }).
    then(service => {
      log('Service found, getting characteristic...');
      let b = Promise.resolve(service[0].getCharacteristics());
      return b;//service.getCharacteristic(0xFFF1);//0xFFE1
    }).
    then(characteristic => {
      log('Characteristic found');
      characteristicCache = characteristic[0];
      writecharacter = characteristic[1];

      return characteristicCache;
    });
}

// Включение получения уведомлений об изменении характеристики
function startNotifications(characteristic) {
  log('Starting notifications...');

  return characteristic.startNotifications().
    then(() => {
      log('Notifications started');
      characteristic.addEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
    });
}

// Получение данных
function handleCharacteristicValueChanged(event) {
  let value = new TextDecoder().decode(event.target.value);

  for (let c of value) {
    if (c === '\n') {
      let data = readBuffer.trim();
      readBuffer = '';

      if (data) {
        receive(data);
      }
    }
    else {
      readBuffer += c;
    }
  }
}

// Обработка полученных данных
function receive(data) {
  log(data, 'in');
}

// Вывод в терминал
function log(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
    '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}

// Отключиться от подключенного устройства
function disconnect() {
  if (deviceCache) {
    log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    deviceCache.removeEventListener('gattserverdisconnected',
      handleDisconnection);

    if (deviceCache.gatt.connected) {
      deviceCache.gatt.disconnect();
      log('"' + deviceCache.name + '" bluetooth device disconnected');
    }
    else {
      log('"' + deviceCache.name +
        '" bluetooth device is already disconnected');
    }
  }

  if (characteristicCache) {
    characteristicCache.removeEventListener('characteristicvaluechanged',
      handleCharacteristicValueChanged);
    characteristicCache = null;
  }

  deviceCache = null;
}

// Отправить данные подключенному устройству
function send(data) {
  data = String(data);

  if (!data || !characteristicCache) {
    return;
  }

  data += '\n';

  if (data.length > 20) {
    let chunks = data.match(/(.|[\r\n]){1,20}/g);

    writeToCharacteristic(writecharacter, chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      setTimeout(() => {
        writeToCharacteristic(writecharacter, chunks[i]);
      }, i * 100);
    }
  }
  else {
    writeToCharacteristic(writecharacter, data);
  }

  log(data, 'out');
}

// Записать значение в характеристику
function writeToCharacteristic(characteristic, data) {
  characteristic.writeValue(new TextEncoder().encode(data));
}
