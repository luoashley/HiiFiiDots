import {StyleSheet} from 'react-native';

const buttons = StyleSheet.create({
  optionButton: {
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 200,
    marginVertical: 20,
    borderRadius: 10,
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    backgroundColor: '#5f9ea0',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 200,
    marginVertical: 20,
    borderRadius: 10,
  },

});

const logo = StyleSheet.create({
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoStyle: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  logoTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
});

const menu = StyleSheet.create({
  menuTitleText: {
    flex: 1,
    marginTop: 30,
    fontSize: 25,
    fontWeight: 'bold',
    marginHorizontal: 20,
    textAlign: 'center',
    color: 'black',
  },
  menuWrapper: {
    justifyContent: 'flex-start',
  },
});

const mainPageStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  mainPageTitleWrapper: {
    flex: 1,
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const modalStyle = StyleSheet.create({
  modalFlatlistContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 25,
  },
  modalCellOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'black',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
  },
  modalTitle: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalTitleText: {
    marginTop: 40,
    fontSize: 25,
    fontWeight: 'bold',
    marginHorizontal: 20,
    textAlign: 'center',
    color: 'black',
  },
});

export {buttons, logo, menu, mainPageStyles, modalStyle};
