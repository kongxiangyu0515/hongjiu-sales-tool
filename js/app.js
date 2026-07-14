let currentCategory = 'all';
let currentSearch = '';
let currentTag = '';
let currentScript = null;
let favorites = [];

function init() {
    loadFavorites();
    renderTagCloud();
    renderList();
    bindEvents();
}

function loadFavorites() {
    try {
        const stored = localStorage.getItem('wineScriptFavorites');
        if (stored) {
            favorites = JSON.parse(stored);
        }
    } catch (e) {
        favorites = [];
    }
    updateFavoritesCount();
}

function saveFavorites() {
    try {
        localStorage.setItem('wineScriptFavorites', JSON.stringify(favorites));
    } catch (e) {
        showToast('保存收藏失败');
    }
    updateFavoritesCount();
}

function updateFavoritesCount() {
    const count = document.getElementById('favorites-count');
    if (count) {
        count.textContent = favorites.length;
    }
}

function bindEvents() {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            setCategory(category);
        });
    });

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim();
        renderList();
    });

    searchBtn.addEventListener('click', () => {
        currentSearch = searchInput.value.trim();
        renderList();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearch = searchInput.value.trim();
            renderList();
        }
    });

    const favoritesBtn = document.getElementById('favorites-btn');
    favoritesBtn.addEventListener('click', showFavorites);

    const closeModal = document.getElementById('close-modal');
    closeModal.addEventListener('click', hideModal);

    const modal = document.getElementById('detail-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    const modalCopyBtn = document.getElementById('modal-copy-btn');
    modalCopyBtn.addEventListener('click', copyCurrentScript);

    const modalFavoriteBtn = document.getElementById('modal-favorite-btn');
    modalFavoriteBtn.addEventListener('click', toggleFavorite);

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });

    const generateBtn = document.getElementById('generate-btn');
    generateBtn.addEventListener('click', generateScript);

    const exampleBtns = document.querySelectorAll('.example-btn');
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const exampleId = e.currentTarget.dataset.example;
            loadExample(exampleId);
        });
    });

    const copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            copyResult(targetId);
        });
    });

    const copyAllBtn = document.getElementById('copy-all-btn');
    copyAllBtn.addEventListener('click', copyAllResult);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    if (tab === 'library') {
        renderList();
    }
}

function generateScript() {
    const customerType = document.getElementById('customer-type').value;
    const relationship = document.getElementById('relationship').value;
    const budget = document.getElementById('budget').value;
    const concern = document.getElementById('concern').value;
    const flavor = document.getElementById('flavor').value;
    const goal = document.getElementById('goal').value;

    if (!customerType || !relationship || !budget || !goal) {
        showToast('请填写必填项：客户身份、客户关系、预算区间、销售目标');
        return;
    }

    const engine = templateEngine;
    const products = engine.productRecommendations[customerType]?.[budget] || [];
    const product = products.length > 0 ? engine.products[products[0]] : null;

    const psychologicalJudgments = engine.psychologicalJudgments[customerType] || [];
    const flavorDesc = flavor ? engine.flavorDescriptions[flavor] : '';
    const objectionHandler = concern ? engine.objectionHandlers[concern] || [] : [];

    let psychologicalJudgment = `${psychologicalJudgments.join('；')}。`;
    if (customerType === '送礼') {
        psychologicalJudgment += `客户想送给${relationship}，`;
    }
    if (concern) {
        psychologicalJudgment += `还担心${concern}。`;
    }

    const entryPointParts = [];
    if (customerType === '送礼') {
        entryPointParts.push('从送礼场景的核心需求切入');
        if (relationship === '领导' || relationship === '客户') {
            entryPointParts.push('强调拿出来体面、对方容易接受');
        } else if (relationship === '长辈') {
            entryPointParts.push('强调健康和口感舒适度');
        } else if (relationship === '伴侣') {
            entryPointParts.push('强调浪漫氛围和口感');
        }
    } else if (customerType === '宴请') {
        entryPointParts.push('从品牌知名度和配餐场景切入');
    } else if (customerType === '新手入门') {
        entryPointParts.push('从新手友好角度切入，降低门槛');
    } else {
        entryPointParts.push('从需求场景切入');
    }
    if (flavor) {
        entryPointParts.push(`强调${flavor}`);
    }
    if (concern) {
        entryPointParts.push(`打消${concern}的顾虑`);
    }
    const entryPoint = entryPointParts.join('，');

    const recommendationLogicParts = [];
    if (product) {
        recommendationLogicParts.push(`预算${budget}适合${product.name}`);
        recommendationLogicParts.push(product.desc);
    }
    if (customerType === '送礼') {
        recommendationLogicParts.push(`送${relationship}很合适`);
    }
    if (flavor) {
        recommendationLogicParts.push(`符合${flavor}的偏好`);
    }
    const recommendationLogic = recommendationLogicParts.join('，');

    const wechatScriptParts = [];
    
    if (goal === '建立信任') {
        if (customerType === '新手入门') {
            wechatScriptParts.push('刚开始喝红酒不用纠结太多，先找一款顺口的试试。');
            if (product) {
                wechatScriptParts.push(`${product.name}这款果香很清新，喝着不涩，很多新手都是从这款开始的。`);
            }
            wechatScriptParts.push('买回去不用醒酒，开瓶就能喝。你先试试喜不喜欢这个味道，喜欢了我们再聊别的。');
        } else {
            wechatScriptParts.push('我在红酒行业做了几年，对智利酒特别了解，有什么问题随时问我。');
            wechatScriptParts.push('咱们先聊聊，看看你喜欢什么口味的。');
        }
    } else if (goal === '推荐单品') {
        if (customerType === '送礼') {
            wechatScriptParts.push(`如果是送${relationship}，我建议别选太小众的酒。`);
            wechatScriptParts.push('送礼最重要不是讲一堆专业词，而是三个点：拿出来体面、对方容易接受、你解释起来不尴尬。');
            if (product) {
                wechatScriptParts.push(`这个预算可以选${product.name}，品牌有辨识度，包装得体，口感也比较大众。`);
            }
            wechatScriptParts.push('你送的时候不用讲太复杂，就说："这款是比较经典的干红，醒十几分钟，配牛排、烤肉都可以。"');
            wechatScriptParts.push('这样对方听得懂，也不会显得你在硬凹专业。');
        } else if (customerType === '宴请') {
            if (product) {
                wechatScriptParts.push(`今晚宴请用${product.name}怎么样？`);
                wechatScriptParts.push('蒙特斯是智利挺有名的酒庄，懂酒的客户一看就知道是正经酒。');
                wechatScriptParts.push('配牛排、烤鸭都很搭，不会出错。');
            }
        } else if (customerType === '自饮') {
            if (product) {
                wechatScriptParts.push(`我自己也在喝${product.name}，${product.desc}。`);
                wechatScriptParts.push('平时晚上回家倒一杯，特别放松。');
            }
        } else {
            if (product) {
                wechatScriptParts.push(`给你推荐${product.name}，${product.desc}。`);
                wechatScriptParts.push('很多客户反馈都不错。');
            }
        }
    } else if (goal === '处理异议') {
        if (concern === '怕买贵') {
            wechatScriptParts.push('我理解你的顾虑，红酒确实有贵有便宜。');
            if (product) {
                wechatScriptParts.push(`${product.name}这个价位，能买到智利名庄的酒，已经很实在了。`);
            }
            wechatScriptParts.push('日常自饮、朋友小聚都很合适，比喝啤酒健康，也有仪式感。');
            wechatScriptParts.push('你先买一瓶试试，喝着觉得值再继续。');
        } else if (concern === '怕不懂') {
            wechatScriptParts.push('不懂没关系，我刚开始也不懂。');
            wechatScriptParts.push('其实喝红酒不用懂太多，喜欢喝最重要。');
            if (product) {
                wechatScriptParts.push(`${product.name}就很适合新手，果香清新不涩，开瓶就能喝。`);
            }
            wechatScriptParts.push('你先买一瓶试试，喝着喜欢再说，我再慢慢教你。');
        } else if (concern === '怕太酸涩') {
            wechatScriptParts.push('这款酒一点不涩，很多新手第一次喝都说好入口。');
            wechatScriptParts.push('它的单宁很柔和，不会像有些红酒那样涩得咽不下去。');
            wechatScriptParts.push('你可以先买一瓶试试，喝着觉得合适再说。');
        } else if (concern === '怕不好入口') {
            wechatScriptParts.push('这款酒果香很清新，特别好入口，很多女生都爱喝。');
            wechatScriptParts.push('它的酸度刚刚好，不会太酸也不会太甜。');
            wechatScriptParts.push('我自己平时也喝这款，真的不难喝。');
        } else if (concern === '怕送礼没面子') {
            wechatScriptParts.push('送礼确实要考虑对方的感受。');
            wechatScriptParts.push('这个预算选的酒，品牌有辨识度，包装也得体，拿出去不会丢面子。');
            wechatScriptParts.push('关键是你送的时候怎么说，不用讲太专业，简单几句就行。');
        } else {
            wechatScriptParts.push('你放心，我给你选的这款肯定合适。');
            wechatScriptParts.push('很多客户跟你一样的顾虑，喝了都说挺好的。');
        }
    } else if (goal === '促成下单') {
        wechatScriptParts.push('我给你准备两款备选，一款偏稳重，一款偏口感。');
        wechatScriptParts.push('你看倾向哪种？我给你具体说说。');
    } else if (goal === '引导复购') {
        wechatScriptParts.push('看你上次买的酒差不多该喝完了吧？');
        wechatScriptParts.push('最近新批次到货，品质和之前一样稳定。');
        wechatScriptParts.push('老客户整箱买有优惠，比单瓶划算不少。');
    }

    const wechatScript = wechatScriptParts.join('\n\n');

    const momentsScriptParts = [];
    if (customerType === '送礼') {
        momentsScriptParts.push('送礼选酒，其实不用纠结太多。');
        momentsScriptParts.push('核心就三个点：品牌有辨识度、口感大众能接受、包装拿得出手。');
        if (product) {
            momentsScriptParts.push(`${product.name}就是这样的选择，送${relationship}很稳妥。`);
        }
    } else if (customerType === '宴请') {
        momentsScriptParts.push('商务宴请，酒选对了，事就成了一半。');
        if (product) {
            momentsScriptParts.push(`${product.name}配餐百搭，品牌有辨识度。`);
        }
        momentsScriptParts.push('细节决定成败。');
    } else if (customerType === '自饮') {
        momentsScriptParts.push('生活不需要太复杂，舒服就好。');
        if (product) {
            momentsScriptParts.push(`${product.name}，日常小酌的好选择。`);
        }
    } else {
        momentsScriptParts.push('好红酒，值得分享。');
        if (product) {
            momentsScriptParts.push(`${product.name}，品质稳定，口碑很好。`);
        }
    }
    const momentsScript = momentsScriptParts.join('\n\n');

    const objectionHandling = objectionHandler.length > 0 ? objectionHandler[0] : '有任何问题随时找我，我帮你解决。';

    let closingLine = '我可以按你的需求给你挑两款，你看想偏哪一种？';
    if (goal === '引导复购') {
        closingLine = '你看是继续上次的款，还是想试试其他的？我给你个参考。';
    } else if (goal === '建立信任') {
        closingLine = '我先给你发个简单的品鉴小贴士，你买回去照着试，有问题随时问我。';
    }

    const result = {
        psychologicalJudgment: engine.filterBannedWords(psychologicalJudgment),
        entryPoint: engine.filterBannedWords(entryPoint),
        recommendationLogic: engine.filterBannedWords(recommendationLogic),
        wechatScript: engine.filterBannedWords(wechatScript),
        momentsScript: engine.filterBannedWords(momentsScript),
        objectionHandling: engine.filterBannedWords(objectionHandling),
        closingLine: engine.filterBannedWords(closingLine)
    };

    renderResult(result);
}

function loadExample(exampleId) {
    const engine = templateEngine;
    const example = engine.examples.find(e => e.id === exampleId);
    if (!example) return;

    document.getElementById('customer-type').value = example.inputs.customerType || '';
    document.getElementById('relationship').value = example.inputs.relationship || '';
    document.getElementById('budget').value = example.inputs.budget || '';
    document.getElementById('concern').value = example.inputs.concern || '';
    document.getElementById('flavor').value = example.inputs.flavor || '';
    document.getElementById('goal').value = example.inputs.goal || '';

    renderResult(example.output);
}

function renderResult(result) {
    document.getElementById('psychological-judgment').textContent = result.psychologicalJudgment;
    document.getElementById('entry-point').textContent = result.entryPoint;
    document.getElementById('recommendation-logic').textContent = result.recommendationLogic;
    document.getElementById('wechat-script').textContent = result.wechatScript;
    document.getElementById('moments-script').textContent = result.momentsScript;
    document.getElementById('objection-handling').textContent = result.objectionHandling;
    document.getElementById('closing-line').textContent = result.closingLine;

    document.getElementById('result-container').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');

    document.getElementById('result-container').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function copyResult(targetId) {
    const element = document.getElementById(targetId);
    if (!element) return;

    let textToCopy = element.textContent;
    if (targetId === 'psychological-judgment') {
        textToCopy = `【客户心理判断】\n${textToCopy}`;
    } else if (targetId === 'entry-point') {
        textToCopy = `【销售切入点】\n${textToCopy}`;
    } else if (targetId === 'recommendation-logic') {
        textToCopy = `【推荐逻辑】\n${textToCopy}`;
    } else if (targetId === 'wechat-script') {
        textToCopy = `【微信私聊话术】\n${textToCopy}`;
    } else if (targetId === 'moments-script') {
        textToCopy = `【朋友圈版本】\n${textToCopy}`;
    } else if (targetId === 'objection-handling') {
        textToCopy = `【异议处理备用话术】\n${textToCopy}`;
    } else if (targetId === 'closing-line') {
        textToCopy = `【下一步轻推进】\n${textToCopy}`;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('复制成功！快去微信粘贴吧');
    }).catch(() => {
        showToast('复制失败，请手动复制');
    });
}

function copyAllResult() {
    const psychologicalJudgment = document.getElementById('psychological-judgment').textContent;
    const entryPoint = document.getElementById('entry-point').textContent;
    const recommendationLogic = document.getElementById('recommendation-logic').textContent;
    const wechatScript = document.getElementById('wechat-script').textContent;
    const momentsScript = document.getElementById('moments-script').textContent;
    const objectionHandling = document.getElementById('objection-handling').textContent;
    const closingLine = document.getElementById('closing-line').textContent;

    const textToCopy = `【客户心理判断】\n${psychologicalJudgment}\n\n【销售切入点】\n${entryPoint}\n\n【推荐逻辑】\n${recommendationLogic}\n\n【微信私聊话术】\n${wechatScript}\n\n【朋友圈版本】\n${momentsScript}\n\n【异议处理备用话术】\n${objectionHandling}\n\n【下一步轻推进】\n${closingLine}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('整套话术已复制！快去微信粘贴吧');
    }).catch(() => {
        showToast('复制失败，请手动复制');
    });
}

function setCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    const title = document.getElementById('results-title');
    title.textContent = categoryNames[category];
    
    renderList();
}

function filterScripts() {
    return wineScripts.filter(script => {
        const matchCategory = currentCategory === 'all' || script.category === currentCategory;
        const matchSearch = !currentSearch || 
            script.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            script.content.toLowerCase().includes(currentSearch.toLowerCase()) ||
            script.scene.toLowerCase().includes(currentSearch.toLowerCase());
        const matchTag = !currentTag || script.tags.includes(currentTag);
        return matchCategory && matchSearch && matchTag;
    });
}

function getTagCounts() {
    const counts = {};
    wineScripts.forEach(script => {
        script.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
    });
    return counts;
}

function renderTagCloud() {
    const tagCloud = document.getElementById('tag-cloud');
    if (!tagCloud) return;
    
    const tagCounts = getTagCounts();
    const allTags = Object.keys(tagNames);
    
    const maxCount = tagCounts && Object.keys(tagCounts).length > 0 
        ? Math.max(...Object.values(tagCounts)) 
        : 1;
    
    tagCloud.innerHTML = allTags.map(tag => {
        const count = tagCounts[tag] || 0;
        const size = Math.max(12, 12 + (count / maxCount) * 12);
        const opacity = 0.6 + (count / maxCount) * 0.4;
        const isActive = currentTag === tag;
        
        return `
            <button 
                class="tag-item ${isActive ? 'active' : ''}" 
                data-tag="${tag}"
                style="font-size: ${size}px; opacity: ${opacity};"
            >
                ${tag} <span class="tag-count">${count}</span>
            </button>
        `;
    }).join('');
    
    document.querySelectorAll('.tag-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tag = e.currentTarget.dataset.tag;
            setTag(tag);
        });
    });
}

function setTag(tag) {
    currentTag = currentTag === tag ? '' : tag;
    renderTagCloud();
    renderList();
}

function renderList() {
    const list = document.getElementById('话术-list');
    if (!list) return;
    
    const filtered = filterScripts();
    
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `共 ${filtered.length} 条`;
    }
    
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍷</div>
                <p>没有找到相关话术</p>
                <p style="font-size: 14px; margin-top: 8px;">试试其他关键词或分类</p>
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map(script => `
        <div class="话术-card" data-id="${script.id}">
            <span class="card-category">${categoryNames[script.category]}</span>
            <h4 class="card-title">${script.title}</h4>
            <p class="card-preview">${script.content.replace(/\n/g, ' ')}</p>
            <div class="card-tags">
                ${script.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.话术-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            showScriptDetail(id);
        });
    });
}

function showScriptDetail(id) {
    currentScript = wineScripts.find(s => s.id === id);
    if (!currentScript) return;

    document.getElementById('modal-title').textContent = currentScript.title;
    document.getElementById('modal-category-tag').textContent = categoryNames[currentScript.category];
    document.getElementById('modal-product-tag').textContent = `关联产品：${currentScript.product}`;
    document.getElementById('modal-scene').textContent = currentScript.scene;
    document.getElementById('modal-text').textContent = currentScript.content;
    
    const tipsList = document.getElementById('modal-tips');
    tipsList.innerHTML = currentScript.tips.map(tip => `
        <li>${tip}</li>
    `).join('');

    updateFavoriteButton();

    document.getElementById('detail-modal').classList.add('show');
}

function hideModal() {
    document.getElementById('detail-modal').classList.remove('show');
    currentScript = null;
}

function updateFavoriteButton() {
    const btn = document.getElementById('modal-favorite-btn');
    const text = document.getElementById('favorite-text');
    const isFavorite = favorites.includes(currentScript.id);
    
    if (isFavorite) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
        text.textContent = '已收藏';
    } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        text.textContent = '收藏';
    }
}

function toggleFavorite() {
    if (!currentScript) return;
    
    const index = favorites.indexOf(currentScript.id);
    if (index === -1) {
        favorites.push(currentScript.id);
        showToast('已添加到收藏夹');
    } else {
        favorites.splice(index, 1);
        showToast('已从收藏夹移除');
    }
    
    saveFavorites();
    updateFavoriteButton();
    renderList();
}

function copyCurrentScript() {
    if (!currentScript) return;
    
    const textToCopy = `【${currentScript.title}】\n\n${currentScript.content}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('复制成功！快去微信粘贴吧');
    }).catch(() => {
        showToast('复制失败，请手动复制');
    });
}

function showFavorites() {
    if (favorites.length === 0) {
        showToast('收藏夹为空');
        return;
    }
    
    const favoriteScripts = wineScripts.filter(s => favorites.includes(s.id));
    
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.tag-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById('results-title').textContent = '我的收藏';
    document.getElementById('results-count').textContent = `共 ${favoriteScripts.length} 条`;
    
    const list = document.getElementById('话术-list');
    list.innerHTML = favoriteScripts.map(script => `
        <div class="话术-card" data-id="${script.id}">
            <span class="card-category">${categoryNames[script.category]}</span>
            <h4 class="card-title">${script.title}</h4>
            <p class="card-preview">${script.content.replace(/\n/g, ' ')}</p>
            <div class="card-tags">
                ${script.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.话术-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            showScriptDetail(id);
        });
    });
    
    currentCategory = 'all';
    currentSearch = '';
    currentTag = '';
    document.getElementById('search-input').value = '';
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

document.addEventListener('DOMContentLoaded', init);