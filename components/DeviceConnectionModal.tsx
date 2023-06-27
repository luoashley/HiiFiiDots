import React, {FC, useCallback} from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Device} from 'react-native-ble-plx';
import {buttons, mainPageStyles, modalStyle} from '../styles/styles';

type DeviceModalListItemProps = {
  item: ListRenderItemInfo<Device>;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

type DeviceModalProps = {
  devices: Device[];
  visible: boolean;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

const DeviceModalListItem: FC<DeviceModalListItemProps> = props => {
  const {item, connectToPeripheral, closeModal} = props;

  const connectAndCloseModal = useCallback(() => {
    connectToPeripheral(item.item);
    closeModal();
  }, [closeModal, connectToPeripheral, item.item]);

  return (
    <View>
      <TouchableOpacity
        onPress={connectAndCloseModal}
        style={buttons.optionButton}>
        <Text style={buttons.optionButtonText}>{item.item.name}</Text>
      </TouchableOpacity>
    </View>
  );
};

const DeviceModal: FC<DeviceModalProps> = props => {
  const {devices, visible, connectToPeripheral, closeModal} = props;

  const renderDeviceModalListItem = useCallback(
    (item: ListRenderItemInfo<Device>) => {
      return (
        <DeviceModalListItem
          item={item}
          connectToPeripheral={connectToPeripheral}
          closeModal={closeModal}
        />
      );
    },
    [closeModal, connectToPeripheral],
  );

  return (
    <Modal
      style={mainPageStyles.container}
      animationType="slide"
      transparent={false}
      visible={visible}>
      <SafeAreaView style={modalStyle.modalTitle}>
        <Text style={modalStyle.modalTitleText}>Select Device</Text>
        <FlatList
          contentContainerStyle={modalStyle.modalFlatlistContainer}
          data={devices}
          renderItem={renderDeviceModalListItem}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default DeviceModal;
