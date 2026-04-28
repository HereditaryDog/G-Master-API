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

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Typography, Tooltip, Modal } from '@douyinfe/semi-ui';
import { Building2, Boxes, CheckCircle2, Grid2X2, Layers3 } from 'lucide-react';
import { getLobeHubIcon } from '../../../../../helpers';
import SearchActions from './SearchActions';

const { Paragraph } = Typography;

const CONFIG = {
  CAROUSEL_INTERVAL: 2000,
  ICON_SIZE: 40,
  UNKNOWN_VENDOR: 'unknown',
};

const CONTENT_TEXTS = {
  unknown: {
    displayName: (t) => t('未知供应商'),
    description: (t) =>
      t(
        '包含来自未知或未标明供应商的AI模型，这些模型可能来自小型供应商或开源项目。',
      ),
  },
  all: {
    description: (t) =>
      t('查看所有可用的AI模型供应商，包括众多知名供应商的模型。'),
  },
  fallback: {
    description: (t) => t('该供应商提供多种AI模型，适用于不同的应用场景。'),
  },
};

const getVendorDisplayName = (vendorName, t) => {
  return vendorName === CONFIG.UNKNOWN_VENDOR
    ? CONTENT_TEXTS.unknown.displayName(t)
    : vendorName;
};

const getAvatarText = (vendorName) =>
  vendorName === CONFIG.UNKNOWN_VENDOR
    ? '?'
    : vendorName.charAt(0).toUpperCase();

const createBrandMarkContent = (vendor, fallbackText) => {
  if (vendor.icon) {
    return getLobeHubIcon(vendor.icon, CONFIG.ICON_SIZE);
  }

  return <span>{vendor.name ? getAvatarText(vendor.name) : fallbackText}</span>;
};

const renderHeroBrandMark = (vendor, title, t) => {
  const displayName = vendor ? getVendorDisplayName(vendor.name, t) : title;
  const fallbackText = title?.slice(0, 1)?.toUpperCase() || 'M';

  const content = vendor ? (
    createBrandMarkContent(vendor, fallbackText)
  ) : (
    <span>{fallbackText}</span>
  );

  return (
    <Tooltip content={displayName} position='top'>
      <div className='gm-pricing-hero-brand-mark'>{content}</div>
    </Tooltip>
  );
};

const PricingVendorIntro = memo(
  ({
    filterVendor,
    models = [],
    allModels = [],
    t,
    selectedRowKeys = [],
    copyText,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    isMobile = false,
    searchValue = '',
    setShowFilterModal,
    showWithRecharge,
    setShowWithRecharge,
    currency,
    setCurrency,
    siteDisplayType,
    showRatio,
    setShowRatio,
    viewMode,
    setViewMode,
    tokenUnit,
    setTokenUnit,
  }) => {
    const [currentOffset, setCurrentOffset] = useState(0);
    const [descModalVisible, setDescModalVisible] = useState(false);
    const [descModalContent, setDescModalContent] = useState('');

    const handleOpenDescModal = useCallback((content) => {
      setDescModalContent(content || '');
      setDescModalVisible(true);
    }, []);

    const handleCloseDescModal = useCallback(() => {
      setDescModalVisible(false);
    }, []);

    const renderDescriptionModal = useCallback(
      () => (
        <Modal
          title={t('供应商介绍')}
          visible={descModalVisible}
          onCancel={handleCloseDescModal}
          footer={null}
          width={isMobile ? '95%' : 600}
          bodyStyle={{
            maxHeight: isMobile ? '70vh' : '60vh',
            overflowY: 'auto',
          }}
        >
          <div className='text-sm mb-4'>{descModalContent}</div>
        </Modal>
      ),
      [descModalVisible, descModalContent, handleCloseDescModal, isMobile, t],
    );

    const vendorInfo = useMemo(() => {
      const vendors = new Map();
      let unknownCount = 0;

      const sourceModels =
        Array.isArray(allModels) && allModels.length > 0 ? allModels : models;

      sourceModels.forEach((model) => {
        if (model.vendor_name) {
          const existing = vendors.get(model.vendor_name);
          if (existing) {
            existing.count++;
          } else {
            vendors.set(model.vendor_name, {
              name: model.vendor_name,
              icon: model.vendor_icon,
              description: model.vendor_description,
              count: 1,
            });
          }
        } else {
          unknownCount++;
        }
      });

      const vendorList = Array.from(vendors.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      if (unknownCount > 0) {
        vendorList.push({
          name: CONFIG.UNKNOWN_VENDOR,
          icon: null,
          description: CONTENT_TEXTS.unknown.description(t),
          count: unknownCount,
        });
      }

      return vendorList;
    }, [allModels, models, t]);

    const currentModelCount = models.length;

    useEffect(() => {
      if (filterVendor !== 'all' || vendorInfo.length <= 1) {
        setCurrentOffset(0);
        return;
      }

      const interval = setInterval(() => {
        setCurrentOffset((prev) => (prev + 1) % vendorInfo.length);
      }, CONFIG.CAROUSEL_INTERVAL);

      return () => clearInterval(interval);
    }, [filterVendor, vendorInfo.length]);

    const getVendorDescription = useCallback(
      (vendorKey) => {
        if (vendorKey === 'all') {
          return CONTENT_TEXTS.all.description(t);
        }
        if (vendorKey === CONFIG.UNKNOWN_VENDOR) {
          return CONTENT_TEXTS.unknown.description(t);
        }
        const vendor = vendorInfo.find((v) => v.name === vendorKey);
        return vendor?.description || CONTENT_TEXTS.fallback.description(t);
      },
      [vendorInfo, t],
    );

    const renderSearchActions = useCallback(
      () => (
        <SearchActions
          selectedRowKeys={selectedRowKeys}
          copyText={copyText}
          handleChange={handleChange}
          handleCompositionStart={handleCompositionStart}
          handleCompositionEnd={handleCompositionEnd}
          isMobile={isMobile}
          searchValue={searchValue}
          setShowFilterModal={setShowFilterModal}
          showWithRecharge={showWithRecharge}
          setShowWithRecharge={setShowWithRecharge}
          currency={currency}
          setCurrency={setCurrency}
          siteDisplayType={siteDisplayType}
          showRatio={showRatio}
          setShowRatio={setShowRatio}
          viewMode={viewMode}
          setViewMode={setViewMode}
          tokenUnit={tokenUnit}
          setTokenUnit={setTokenUnit}
          t={t}
        />
      ),
      [
        selectedRowKeys,
        copyText,
        handleChange,
        handleCompositionStart,
        handleCompositionEnd,
        isMobile,
        searchValue,
        setShowFilterModal,
        showWithRecharge,
        setShowWithRecharge,
        currency,
        setCurrency,
        siteDisplayType,
        showRatio,
        setShowRatio,
        viewMode,
        setViewMode,
        tokenUnit,
        setTokenUnit,
        t,
      ],
    );

    const getScopedModels = useCallback(
      (vendorKey) => {
        const sourceModels =
          Array.isArray(allModels) && allModels.length > 0 ? allModels : models;

        if (vendorKey === 'all') {
          return sourceModels;
        }

        if (vendorKey === CONFIG.UNKNOWN_VENDOR) {
          return sourceModels.filter((model) => !model.vendor_name);
        }

        return sourceModels.filter((model) => model.vendor_name === vendorKey);
      },
      [allModels, models],
    );

    const getHeroStats = useCallback(
      (vendorKey) => {
        const scopedModels = getScopedModels(vendorKey);
        const totalModelCount = scopedModels.length || currentModelCount;
        const supplierCount =
          vendorKey === 'all' ? Math.max(vendorInfo.length, 1) : 1;

        return [
          {
            key: 'suppliers',
            label: t('供应商'),
            value: supplierCount,
            icon: Boxes,
            tone: 'purple',
          },
          {
            key: 'available',
            label: t('可用模型'),
            value: currentModelCount,
            icon: Grid2X2,
            tone: 'blue',
          },
          {
            key: 'total',
            label: t('模型总数'),
            value: totalModelCount,
            icon: Layers3,
            tone: 'cyan',
          },
          {
            key: 'availability',
            label: t('可用性'),
            value: currentModelCount > 0 ? '99.9%' : '--',
            icon: CheckCircle2,
            tone: 'green',
          },
        ];
      },
      [currentModelCount, getScopedModels, t, vendorInfo.length],
    );

    const renderHeaderCard = useCallback(
      ({ title, count, description, vendorKey, brandVendor }) => (
        <div className='gm-pricing-top-stack'>
          <section className='gm-pricing-hero-card'>
            <div className='gm-pricing-hero-main'>
              <div className='gm-pricing-hero-emblem'>
                <Building2 size={38} strokeWidth={1.8} />
              </div>
              <div className='gm-pricing-hero-copy'>
                <div className='gm-pricing-hero-title-row'>
                  <h2>{title}</h2>
                  <span className='gm-pricing-hero-count'>
                    {t('共 {{count}} 个模型', { count })}
                  </span>
                </div>
                <Paragraph
                  className='gm-pricing-hero-description'
                  ellipsis={{ rows: 2 }}
                  onClick={() => handleOpenDescModal(description)}
                >
                  {description}
                </Paragraph>
              </div>
            </div>

            <div className='gm-pricing-hero-side'>
              <div className='gm-pricing-hero-stats'>
                {getHeroStats(vendorKey).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      className='gm-pricing-hero-stat'
                      data-tone={item.tone}
                      key={item.key}
                    >
                      <span className='gm-pricing-hero-stat-icon'>
                        <Icon size={20} strokeWidth={1.9} />
                      </span>
                      <span className='gm-pricing-hero-stat-value'>
                        {item.value}
                      </span>
                      <span className='gm-pricing-hero-stat-label'>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {renderHeroBrandMark(brandVendor, title, t)}
            </div>
          </section>

          {renderSearchActions()}
        </div>
      ),
      [getHeroStats, handleOpenDescModal, renderSearchActions, t],
    );

    const renderAllVendorsAvatar = useCallback(() => {
      const currentVendor =
        vendorInfo.length > 0
          ? vendorInfo[currentOffset % vendorInfo.length]
          : null;
      return currentVendor;
    }, [vendorInfo, currentOffset, t]);

    if (filterVendor === 'all') {
      const headerCard = renderHeaderCard({
        title: t('全部供应商'),
        count: getScopedModels('all').length || currentModelCount,
        description: getVendorDescription('all'),
        vendorKey: 'all',
        brandVendor: renderAllVendorsAvatar(),
      });
      return (
        <>
          {headerCard}
          {renderDescriptionModal()}
        </>
      );
    }

    const currentVendor = vendorInfo.find((v) => v.name === filterVendor);
    if (!currentVendor) {
      return null;
    }

    const vendorDisplayName = getVendorDisplayName(currentVendor.name, t);

    const headerCard = renderHeaderCard({
      title: vendorDisplayName,
      count: getScopedModels(currentVendor.name).length || currentModelCount,
      description:
        currentVendor.description || getVendorDescription(currentVendor.name),
      vendorKey: currentVendor.name,
      brandVendor: currentVendor,
    });

    return (
      <>
        {headerCard}
        {renderDescriptionModal()}
      </>
    );
  },
);

PricingVendorIntro.displayName = 'PricingVendorIntro';

export default PricingVendorIntro;
