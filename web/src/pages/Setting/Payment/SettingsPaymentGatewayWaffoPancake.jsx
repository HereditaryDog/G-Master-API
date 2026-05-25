/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useRef, useState } from 'react';
import { Banner, Button, Col, Form, Row, Select, Spin } from '@douyinfe/semi-ui';
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { BookOpen, TriangleAlert } from 'lucide-react';

const defaultInputs = {
  WaffoPancakeEnabled: false,
  WaffoPancakeSandbox: false,
  WaffoPancakeMerchantID: '',
  WaffoPancakePrivateKey: '',
  WaffoPancakeWebhookPublicKey: '',
  WaffoPancakeWebhookTestKey: '',
  WaffoPancakeStoreID: '',
  WaffoPancakeProductID: '',
  WaffoPancakeReturnURL: '',
  WaffoPancakeCurrency: 'USD',
  WaffoPancakeUnitPrice: 1.0,
  WaffoPancakeMinTopUp: 1,
};

const toBoolean = (value) => value === true || value === 'true';

export default function SettingsPaymentGatewayWaffoPancake(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle
    ? undefined
    : t('Waffo Pancake 设置');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(defaultInputs);
  const [catalog, setCatalog] = useState([]);
  const formApiRef = useRef(null);

  useEffect(() => {
    if (!props.options || !formApiRef.current) return;

    const currentInputs = {
      WaffoPancakeEnabled: toBoolean(props.options.WaffoPancakeEnabled),
      WaffoPancakeSandbox: toBoolean(props.options.WaffoPancakeSandbox),
      WaffoPancakeMerchantID: props.options.WaffoPancakeMerchantID || '',
      WaffoPancakePrivateKey: props.options.WaffoPancakePrivateKey || '',
      WaffoPancakeWebhookPublicKey:
        props.options.WaffoPancakeWebhookPublicKey || '',
      WaffoPancakeWebhookTestKey:
        props.options.WaffoPancakeWebhookTestKey || '',
      WaffoPancakeStoreID: props.options.WaffoPancakeStoreID || '',
      WaffoPancakeProductID: props.options.WaffoPancakeProductID || '',
      WaffoPancakeReturnURL: props.options.WaffoPancakeReturnURL || '',
      WaffoPancakeCurrency: props.options.WaffoPancakeCurrency || 'USD',
      WaffoPancakeUnitPrice:
        props.options.WaffoPancakeUnitPrice !== undefined
          ? parseFloat(props.options.WaffoPancakeUnitPrice)
          : 1.0,
      WaffoPancakeMinTopUp:
        props.options.WaffoPancakeMinTopUp !== undefined
          ? parseFloat(props.options.WaffoPancakeMinTopUp)
          : 1,
    };

    setInputs(currentInputs);
    formApiRef.current.setValues(currentInputs);
  }, [props.options]);

  const getCurrentValues = () => ({
    ...inputs,
    ...(formApiRef.current?.getValues?.() || {}),
  });

  const readAdminCreds = (values) => {
    const merchantID = String(values.WaffoPancakeMerchantID || '').trim();
    const privateKey = String(values.WaffoPancakePrivateKey || '').trim();
    const savedMerchantID = String(
      props.options?.WaffoPancakeMerchantID || '',
    ).trim();
    const edited = merchantID !== savedMerchantID || privateKey.length > 0;
    if (!edited) {
      return { merchantID: '', privateKey: '' };
    }
    return { merchantID, privateKey };
  };

  const ensureAdminCredsReady = (values) => {
    const { merchantID, privateKey } = readAdminCreds(values);
    if (!merchantID && !privateKey && props.options?.WaffoPancakeMerchantID) {
      return true;
    }
    if (!merchantID || !privateKey) {
      showError(t('请同时填写商户 ID 和 API 私钥'));
      return false;
    }
    return true;
  };

  const applyBinding = (storeID, productID) => {
    const values = {
      ...getCurrentValues(),
      WaffoPancakeStoreID: storeID || '',
      WaffoPancakeProductID: productID || '',
    };
    setInputs(values);
    formApiRef.current?.setValues(values);
  };

  const loadWaffoPancakeCatalog = async (preselect = {}) => {
    const values = getCurrentValues();
    if (!ensureAdminCredsReady(values)) {
      return;
    }
    const { merchantID, privateKey } = readAdminCreds(values);
    setLoading(true);
    try {
      const res = await API.post('/api/option/waffo-pancake/catalog', {
        merchant_id: merchantID,
        private_key: privateKey,
      });
      if (res.data.message !== 'success') {
        showError(
          typeof res.data.data === 'string'
            ? res.data.data
            : t('拉取 Waffo Pancake 目录失败'),
        );
        return;
      }
      const stores = res.data.data?.stores || [];
      setCatalog(stores);

      const requestedStoreID =
        preselect.storeID || values.WaffoPancakeStoreID || '';
      const requestedProductID =
        preselect.productID || values.WaffoPancakeProductID || '';
      const boundStore = stores.find((store) =>
        (store.onetimeProducts || []).some(
          (product) => product.id === requestedProductID,
        ),
      );
      if (boundStore && requestedProductID) {
        applyBinding(boundStore.id, requestedProductID);
      } else if (requestedStoreID || requestedProductID) {
        applyBinding(requestedStoreID, requestedProductID);
      } else {
        const storeWithProducts = stores.find(
          (store) => (store.onetimeProducts || []).length > 0,
        );
        if (storeWithProducts) {
          applyBinding(
            storeWithProducts.id,
            storeWithProducts.onetimeProducts[0].id,
          );
        }
      }
      showSuccess(t('Waffo Pancake 目录已更新'));
    } catch (error) {
      showError(t('拉取 Waffo Pancake 目录失败'));
    } finally {
      setLoading(false);
    }
  };

  const createWaffoPancakePair = async () => {
    const values = getCurrentValues();
    if (!ensureAdminCredsReady(values)) {
      return;
    }
    const { merchantID, privateKey } = readAdminCreds(values);
    setLoading(true);
    try {
      const res = await API.post('/api/option/waffo-pancake/pair', {
        merchant_id: merchantID,
        private_key: privateKey,
        return_url: removeTrailingSlash(values.WaffoPancakeReturnURL || ''),
      });
      if (res.data.message !== 'success') {
        const data = res.data.data;
        if (data?.orphan_store && data?.store_id) {
          applyBinding(data.store_id, '');
        }
        showError(
          data?.error ||
            (typeof data === 'string' ? data : t('创建店铺与产品失败')),
        );
        return;
      }
      const data = res.data.data || {};
      applyBinding(data.store_id, data.product_id);
      await loadWaffoPancakeCatalog({
        storeID: data.store_id,
        productID: data.product_id,
      });
      showSuccess(t('店铺与产品已创建'));
    } catch (error) {
      showError(t('创建店铺与产品失败'));
    } finally {
      setLoading(false);
    }
  };

  const storeOptions = catalog.map((store) => ({
    value: store.id,
    label: `${store.name || store.id} (${store.id})`,
  }));
  if (
    inputs.WaffoPancakeStoreID &&
    !storeOptions.some((option) => option.value === inputs.WaffoPancakeStoreID)
  ) {
    storeOptions.push({
      value: inputs.WaffoPancakeStoreID,
      label: inputs.WaffoPancakeStoreID,
    });
  }
  const selectedStore = catalog.find(
    (store) => store.id === inputs.WaffoPancakeStoreID,
  );
  const productOptions = (selectedStore?.onetimeProducts || []).map(
    (product) => ({
      value: product.id,
      label: `${product.name || product.id} (${product.id})`,
    }),
  );
  if (
    inputs.WaffoPancakeProductID &&
    !productOptions.some(
      (option) => option.value === inputs.WaffoPancakeProductID,
    )
  ) {
    productOptions.push({
      value: inputs.WaffoPancakeProductID,
      label: inputs.WaffoPancakeProductID,
    });
  }

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitWaffoPancakeSetting = async () => {
    const values = {
      ...inputs,
      ...(formApiRef.current?.getValues?.() || {}),
    };
    values.WaffoPancakeEnabled = toBoolean(values.WaffoPancakeEnabled);
    values.WaffoPancakeSandbox = toBoolean(values.WaffoPancakeSandbox);
    const currentWebhookField = values.WaffoPancakeSandbox
      ? 'WaffoPancakeWebhookTestKey'
      : 'WaffoPancakeWebhookPublicKey';
    const currentWebhookLabel = values.WaffoPancakeSandbox
      ? t('Webhook 公钥（测试环境）')
      : t('Webhook 公钥（生产环境）');

    if (values.WaffoPancakeEnabled && !values.WaffoPancakeMerchantID.trim()) {
      showError(t('请输入商户 ID'));
      return;
    }

    if (values.WaffoPancakeEnabled && !values.WaffoPancakeStoreID.trim()) {
      showError(t('请输入 Store ID'));
      return;
    }

    if (values.WaffoPancakeEnabled && !values.WaffoPancakeProductID.trim()) {
      showError(t('请输入 Product ID'));
      return;
    }

    if (
      values.WaffoPancakeEnabled &&
      !String(values[currentWebhookField] || '').trim()
    ) {
      showError(currentWebhookLabel);
      return;
    }

    if (
      values.WaffoPancakeEnabled &&
      Number(values.WaffoPancakeUnitPrice) <= 0
    ) {
      showError(t('充值价格必须大于 0'));
      return;
    }

    if (values.WaffoPancakeEnabled && Number(values.WaffoPancakeMinTopUp) < 1) {
      showError(t('最低充值美元数量必须大于 0'));
      return;
    }

    setLoading(true);
    try {
      const optionUpdates = [
        {
          key: 'WaffoPancakeEnabled',
          value: values.WaffoPancakeEnabled ? 'true' : 'false',
        },
        {
          key: 'WaffoPancakeSandbox',
          value: values.WaffoPancakeSandbox ? 'true' : 'false',
        },
        {
          key: 'WaffoPancakeCurrency',
          value: values.WaffoPancakeCurrency || 'USD',
        },
        {
          key: 'WaffoPancakeUnitPrice',
          value: String(values.WaffoPancakeUnitPrice),
        },
        {
          key: 'WaffoPancakeMinTopUp',
          value: String(values.WaffoPancakeMinTopUp),
        },
      ];

      if ((values.WaffoPancakeWebhookPublicKey || '').trim()) {
        optionUpdates.push({
          key: 'WaffoPancakeWebhookPublicKey',
          value: values.WaffoPancakeWebhookPublicKey,
        });
      }

      if ((values.WaffoPancakeWebhookTestKey || '').trim()) {
        optionUpdates.push({
          key: 'WaffoPancakeWebhookTestKey',
          value: values.WaffoPancakeWebhookTestKey,
        });
      }

      const saveRes = await API.post('/api/option/waffo-pancake/save', {
        merchant_id: values.WaffoPancakeMerchantID || '',
        private_key: values.WaffoPancakePrivateKey || '',
        return_url: removeTrailingSlash(values.WaffoPancakeReturnURL || ''),
        store_id: values.WaffoPancakeStoreID || '',
        product_id: values.WaffoPancakeProductID || '',
      });
      if (saveRes.data.message !== 'success') {
        showError(
          typeof saveRes.data.data === 'string'
            ? saveRes.data.data
            : t('保存 Waffo Pancake 绑定失败'),
        );
        return;
      }

      const results = await Promise.all(
        optionUpdates.map((opt) =>
          API.put('/api/option/', {
            key: opt.key,
            value: opt.value,
          }),
        ),
      );

      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => showError(res.data.message));
        return;
      }

      showSuccess(t('更新成功'));
      props.refresh?.();
    } catch (error) {
      showError(t('更新失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={sectionTitle}>
          <Banner
            type='info'
            icon={<BookOpen size={16} />}
            description={
              <>
                Waffo Pancake 的商户、商品和签名密钥请
                <a
                  href='https://docs.waffo.ai'
                  target='_blank'
                  rel='noreferrer'
                >
                  点击此处
                </a>
                获取，建议先在测试环境完成联调。
                <br />
                {t('回调地址')}：
                {props.options.ServerAddress
                  ? removeTrailingSlash(props.options.ServerAddress)
                  : t('网站地址')}
                /api/waffo-pancake/webhook
              </>
            }
            style={{ marginBottom: 12 }}
          />
          <Banner
            type='warning'
            icon={<TriangleAlert size={16} />}
            description={t(
              '请确认 Merchant、Store、Product 和所选环境密钥一致。',
            )}
            style={{ marginBottom: 16 }}
          />
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.Switch
                field='WaffoPancakeEnabled'
                label={t('启用 Waffo Pancake')}
                checkedText='｜'
                uncheckedText='〇'
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.Switch
                field='WaffoPancakeSandbox'
                label={t('沙盒模式')}
                checkedText='｜'
                uncheckedText='〇'
                extraText={t('用于切换当前下单和回调校验所使用的环境')}
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.Input
                field='WaffoPancakeCurrency'
                label={t('货币')}
                placeholder='USD'
                extraText={t('默认使用 USD 结算')}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='WaffoPancakeMerchantID'
                label={t('商户 ID')}
                placeholder={t('例如：MER_xxx')}
                extraText={t('请填写当前环境对应的商户 ID')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Select
                value={inputs.WaffoPancakeStoreID}
                optionList={storeOptions}
                onChange={(value) => applyBinding(value, '')}
                style={{ width: '100%', marginBottom: 8 }}
                placeholder={t('从目录选择 Store')}
                showClear
              />
              <Form.Input
                field='WaffoPancakeStoreID'
                label={t('Store ID')}
                placeholder={t('例如：STO_xxx')}
                extraText={t('请填写当前环境对应的 Store ID')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Select
                value={inputs.WaffoPancakeProductID}
                optionList={productOptions}
                onChange={(value) =>
                  applyBinding(inputs.WaffoPancakeStoreID, value)
                }
                style={{ width: '100%', marginBottom: 8 }}
                placeholder={t('从目录选择 Product')}
                showClear
              />
              <Form.Input
                field='WaffoPancakeProductID'
                label={t('Product ID')}
                placeholder={t('例如：PROD_xxx')}
                extraText={t('请填写当前环境对应的 Product ID')}
              />
            </Col>
          </Row>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            <Button onClick={() => loadWaffoPancakeCatalog()}>
              {t('拉取店铺与产品目录')}
            </Button>
            <Button type='secondary' onClick={createWaffoPancakePair}>
              {t('自动创建店铺与产品')}
            </Button>
          </div>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.TextArea
                field='WaffoPancakePrivateKey'
                label={t('API 私钥')}
                placeholder={t('填写后覆盖当前私钥，留空表示保持当前不变')}
                extraText={t('保存后不会回显，请填写当前环境对应的 API 私钥')}
                type='password'
                autosize={{ minRows: 4, maxRows: 8 }}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WaffoPancakeReturnURL'
                label={t('支付返回地址')}
                placeholder={t('例如：https://example.com/console/topup')}
                extraText={t('留空则自动使用当前站点的默认充值页地址')}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.TextArea
                field='WaffoPancakeWebhookPublicKey'
                label={t('Webhook 公钥（生产环境）')}
                placeholder={t(
                  '填写后覆盖当前生产环境 Webhook 公钥，留空表示保持当前不变',
                )}
                extraText={t('用于校验生产环境的 Waffo Pancake Webhook 签名')}
                type='password'
                autosize={{ minRows: 4, maxRows: 8 }}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.TextArea
                field='WaffoPancakeWebhookTestKey'
                label={t('Webhook 公钥（测试环境）')}
                placeholder={t(
                  '填写后覆盖当前测试环境 Webhook 公钥，留空表示保持当前不变',
                )}
                extraText={t('用于校验测试环境的 Waffo Pancake Webhook 签名')}
                type='password'
                autosize={{ minRows: 4, maxRows: 8 }}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='WaffoPancakeUnitPrice'
                precision={2}
                label={t('充值价格（x元/美金）')}
                placeholder={t('例如：7，就是7元/美金')}
                extraText={t('按 1 美元对应的站内价格填写')}
                min={0}
              />
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='WaffoPancakeMinTopUp'
                label={t('最低充值美元数量')}
                placeholder={t('例如：2，就是最低充值2$')}
                extraText={t('用户单次最少可充值的美元数量')}
                min={1}
              />
            </Col>
          </Row>

          <Button onClick={submitWaffoPancakeSetting}>
            {t('更新 Waffo Pancake 设置')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
