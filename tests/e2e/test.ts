import { RequestConsoleLogger } from './helpers/testcafe-helper';
import { openOsagoPage, osagoPage } from './pages/osagoPage';

// eslint-disable-next-line no-undef
fixture(`Osago e2e tests`)
  .requestHooks(new RequestConsoleLogger([(request: any) => request.url.startsWith('!')]));

test('Happy path @osago', async (t) => {
  await openOsagoPage('https://www.sravni.ru');

  const carNumber = 'Н399МН77';

  await osagoPage.fillMain(carNumber);

  await osagoPage.fillAutoData('ВАЗ Лада', '2104', 1998, 72);

  await osagoPage.fillPeriodAndRegion();

  const drivers = [{"BirthDate":"1985-11-18T00:00:00","License":{"Series":"9969","Number":"982119","Date":"2019-11-06T00:00:00"},"Passport":null,"LastName":"Петухов","MiddleName":"Сергеевич","FirstName":"Иван"}];
  const owner = {"Passport":{"Series":"2406","Number":"262911","IssueDate":"2006-09-04T00:00:00"},"BirthDate":"1983-11-18T00:00:00", "RegistrationAddress":"Г ИВАНОВО, УЛ ЛЕЖНЕВСКАЯ, Д 122, КВ. 69","LastName":"Петухов","MiddleName":"Сергеевич","FirstName":"Иван"};
  // const insurer = [];
  await osagoPage.fillDriversData(false, drivers, {"vin": "XTA210430W0677553" });

  await osagoPage.proceedWithSomeInsurer(190, 5000, false);

  // @ts-ignore
  await osagoPage.fillInsurerData(owner, owner);

  const carDocument = {"Series":"3754","Number":"570622","Date":"2015-06-17T00:00:00","DocumentType":2};
  // query.CarDocument.Series = '5555';
  // query.CarDocument.Number = '666666';
  await osagoPage.fillAutoRegData(carNumber, {"vin": "XTA420430W0677553" }, carDocument,undefined);

  await osagoPage.fillContactsData();

  await t.click(osagoPage.confirmationData.editAutoRegData);

  const newCarNumber = 'Н942КВ30';
  const newAutoIdentifier = {"vin":"A7LLYRB2HAH945725"};
  const newCarDocument = {"Series":"5342","Number":"612480","Date":"2019-05-06T00:00:00","DocumentType":2};

  await osagoPage.fillAutoRegData(newCarNumber, newAutoIdentifier, newCarDocument, undefined);

  await t.click(osagoPage.contactsData.nextStep);

  const textContent = await osagoPage.confirmationData.autoRegDataInfo
    .textContent;

  await t.expect(textContent).contains(newCarNumber);

  await t
    .expect(textContent)
    .contains(newAutoIdentifier["vin"]);

  await t
    .expect(textContent)
    .contains(`${newCarDocument.Series}${newCarDocument.Number}`);
});
