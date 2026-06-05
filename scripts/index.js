document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================
    // 1. 실시간 최근 수정 시각 반영 기능
    // =========================================
    const initLastModifiedTime = () => {
        const timeElem = document.getElementById("last-modified-time");
        if (timeElem) {
            // 브라우저가 인식하는 파일의 마지막 수정 시각을 가져옴
            const lastModDate = new Date(document.lastModified);
            // 로컬 환경 등에 의해 시간을 못 가져올 경우 현재 시각으로 대체
            const targetDate = isNaN(lastModDate.getTime()) ? new Date() : lastModDate;
            
            // YYYY-MM-DD HH:MM:SS 포맷팅
            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getDate()).padStart(2, '0');
            const hh = String(targetDate.getHours()).padStart(2, '0');
            const min = String(targetDate.getMinutes()).padStart(2, '0');
            const ss = String(targetDate.getSeconds()).padStart(2, '0');
            
            timeElem.textContent = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        }
    };
    initLastModifiedTime();


    // =========================================
    // 2. 목차 (TOC) 숨기기/보이기 기능
    // =========================================
    const tocToggleHeader = document.getElementById("toc-toggle");
    const tocIcon = tocToggleHeader ? tocToggleHeader.querySelector(".toc-icon") : null;
    const tocList = document.getElementById("toc-list");

    if (tocToggleHeader && tocList && tocIcon) {
        tocToggleHeader.addEventListener("click", () => {
            const isHidden = tocList.style.display === "none";
            
            // 리스트 영역 디스플레이 토글
            tocList.style.display = isHidden ? "block" : "none";
            
            // SVG 아이콘 회전 클래스 토글 (v ↔ <)
            if (isHidden) {
                tocIcon.classList.remove("collapsed");
            } else {
                tocIcon.classList.add("collapsed");
            }
        });
    }

    // 목차 항목 클릭 시 해당 문단으로 부드러운 스크롤 이동
    document.querySelectorAll('.wiki-toc a, .toc-return').forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault(); // 기본 링크 이동(새로고침/깜빡임) 방지
            // href="#s-1" 에서 "s-1" 추출
            const targetId = this.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // 상단 여백을 20px 정도 남기고 스크롤
                window.scrollTo({
                    top: targetElement.offsetTop - 20,
                    behavior: "smooth"
                });
            }
        });
    });


    // =========================================
    // 3. 본문 문단 전체(h2, h3) 클릭 시 접기/펼치기 기능
    // =========================================
    document.querySelectorAll(".section-title").forEach(title => {
        title.addEventListener("click", function(e) {
            // [편집] 버튼이나 문단 번호(<a> 태그)를 클릭했을 때는 접기 기능 작동 방지
            if (e.target.tagName.toLowerCase() === 'a') {
                return; 
            }

            // 제목 자체에 'collapsed' 클래스 토글 (CSS로 아이콘 회전, 텍스트 색상 연하게 처리)
            this.classList.toggle("collapsed");
            
            // DOM 구조상 제목(h2, h3) 바로 다음에 나오는 본문 영역(div.section-content) 탐색
            let nextEl = this.nextElementSibling;
            while (nextEl && !nextEl.classList.contains("section-content")) {
                nextEl = nextEl.nextElementSibling; // 다른 요소가 끼어있다면 건너뜀
            }
            
            // 찾은 본문 영역을 숨기거나 보여줌
            if (nextEl) {
                nextEl.style.display = this.classList.contains("collapsed") ? "none" : "block";
            }
        });
    });


    // =========================================
    // 4. 인포박스 상세 정보 [펼치기]/[접기] 기능
    // =========================================
    const infoboxToggleBtn = document.getElementById("infobox-toggle-btn");
    const infoboxHiddenRows = document.querySelectorAll(".infobox-hidden-row");
    
    if (infoboxToggleBtn) {
        infoboxToggleBtn.addEventListener("click", () => {
            // 첫 번째 숨김 행의 상태를 확인하여 전체 토글 기준으로 삼음
            let isHidden = infoboxHiddenRows[0].style.display === "none";
            
            infoboxHiddenRows.forEach(row => {
                row.style.display = isHidden ? "table-row" : "none";
            });
            
            // ★ 수정됨: 텍스트를 변경하던 아래 코드를 삭제했습니다.
            // infoboxToggleBtn.textContent = isHidden ? "[접기]" : "[펼치기]";
        });
    }


// =========================================
    // 5. 각주(주석) 이동, 호버 및 팝업 기능
    // =========================================
    const footnoteLinks = document.querySelectorAll('.footnote-link');
    const modalOverlay = document.getElementById('footnote-modal');
    const modalText = document.getElementById('footnote-modal-text');
    const modalCloseBtn = document.getElementById('footnote-modal-close');

    // PC 툴팁 생성
    let pcTooltip = document.getElementById('pc-tooltip');
    if (!pcTooltip) {
        pcTooltip = document.createElement('div');
        pcTooltip.id = 'pc-tooltip';
        pcTooltip.className = 'pc-tooltip';
        document.body.appendChild(pcTooltip);
    }

    footnoteLinks.forEach(link => {
        // [PC] 마우스 호버 시 툴팁 표시
        link.addEventListener('mouseenter', function() {
            if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                const fnId = this.getAttribute('data-id');
                const fnText = this.getAttribute('data-footnote');
                
                pcTooltip.innerHTML = `<span style="color:#0275d8">[${fnId}]</span> ${fnText}`;
                pcTooltip.classList.add('active');

                const linkRect = this.getBoundingClientRect();
                const tooltipRect = pcTooltip.getBoundingClientRect();
                const viewportWidth = window.innerWidth;

                let topPos = linkRect.top - tooltipRect.height - 10;
                let leftPos = linkRect.left + (linkRect.width / 2) - (tooltipRect.width / 2);
                let arrowPos = 50;

                if (leftPos < 10) { 
                    leftPos = 10;
                    arrowPos = ((linkRect.left + linkRect.width / 2 - leftPos) / tooltipRect.width) * 100;
                } else if (leftPos + tooltipRect.width > viewportWidth - 10) { 
                    leftPos = viewportWidth - tooltipRect.width - 10;
                    arrowPos = ((linkRect.left + linkRect.width / 2 - leftPos) / tooltipRect.width) * 100;
                }

                pcTooltip.style.top = `${topPos}px`;
                pcTooltip.style.left = `${leftPos}px`;
                pcTooltip.style.setProperty('--arrow-pos', `${arrowPos}%`);
            }
        });

        // [PC] 마우스 아웃 시 툴팁 숨기기
        link.addEventListener('mouseleave', function() {
            if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                pcTooltip.classList.remove('active');
            }
        });

        // [본문 -> 하단] 각주 번호 클릭 시 이동
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // [PC] 아래쪽 각주 영역으로 이동 (배경색 반짝임 효과 제거 완료)
            if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                const fnId = this.getAttribute('data-id');
                const targetFootnote = document.getElementById(`fn-${fnId}`);
                if (targetFootnote) {
                    targetFootnote.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return; 
            }

            // [모바일] 터치 시 모달 팝업
            const fnId = this.getAttribute('data-id');
            const fnText = this.getAttribute('data-footnote');
            modalText.innerHTML = `<span class="fn-id">[${fnId}]</span> ${fnText}`;
            modalOverlay.classList.add('active'); 
        });
    });

    // =========================================
    // [하단 -> 본문] 아래쪽 각주 번호 클릭 시 위로 올라가기
    // =========================================
    const footnoteBacklinks = document.querySelectorAll('.footnote-backlink');
    footnoteBacklinks.forEach(backlink => {
        backlink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetAnchor = document.getElementById(targetId);
            
            if (targetAnchor) {
                // 1. 타겟이 접혀있는 인포박스(infobox-hidden-row) 안에 있다면 강제로 펼치기
                const hiddenRow = targetAnchor.closest('.infobox-hidden-row');
                if (hiddenRow && hiddenRow.style.display === 'none') {
                    // 인포박스 내부의 숨겨진 줄을 모두 보이게 처리
                    const infobox = targetAnchor.closest('.infobox');
                    if (infobox) {
                        const allHiddenRows = infobox.querySelectorAll('.infobox-hidden-row');
                        allHiddenRows.forEach(row => { row.style.display = 'table-row'; });
                        
                        // '더보기' 버튼 텍스트가 있다면 '접기'로 변경 (클래스명에 맞춰 동작)
                        const toggleBtn = infobox.querySelector('.infobox-toggle-btn');
                        if (toggleBtn) toggleBtn.innerText = '접기';
                    }
                }

                // 2. 만약 details 태그(접은 글) 안에 있다면 강제로 열기
                const detailsParent = targetAnchor.closest('details');
                if (detailsParent && !detailsParent.open) {
                    detailsParent.open = true;
                }

                // 3. 브라우저가 화면을 펼치는 시간을 아주 잠깐(0.05초) 기다린 후 부드럽게 스크롤
                setTimeout(() => {
                    targetAnchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
        });
    });

    // 모달 닫기 로직
    const closeFootnoteModal = () => { modalOverlay.classList.remove('active'); };
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeFootnoteModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeFootnoteModal();
        });
    }

    // =========================================
    // 6. 우측 하단 플로팅 내비게이션 동작 기능
    // =========================================
    const navToc = document.getElementById("nav-toc");
    const navUp = document.getElementById("nav-up");
    const navDown = document.getElementById("nav-down");

    // 목차 버튼 클릭 -> 목차 영역으로 스크롤
    if (navToc) {
        navToc.addEventListener("click", () => {
            const tocArea = document.getElementById("toc");
            if (tocArea) window.scrollTo({ top: tocArea.offsetTop - 20, behavior: "smooth" });
        });
    }

    // 위로 버튼 클릭 -> 페이지 최상단으로 스크롤
    if (navUp) {
        navUp.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // 아래로 버튼 클릭 -> 페이지 최하단으로 스크롤
    if (navDown) {
        navDown.addEventListener("click", () => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        });
    }

});