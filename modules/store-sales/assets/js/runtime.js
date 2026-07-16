const GTRuntime = (() => {

    // =====================================================
    // PRIVATE CONFIG
    // =====================================================

    const PRODUCT_CODE_PARTS = [
        71, 84, 65, 83, 83
    ];

    const OWNER_ID_PARTS = [
        49, 57, 48, 48, 50, 51, 54, 57
    ];

    const BRAND_PARTS = [
        75, 65, 78, 71, 79, 68, 73, 78, 71, 46, 79, 82, 71
    ];


    /*
    FREE ACCESS END DATE

    Saat ini:
    31 Agustus 2026

    Disimpan sebagai:
    year XOR 731
    month XOR 29
    day XOR 47
    */

   const FREE_LIMIT = {

    y: 2026 ^ 731,

    m: 11 ^ 29,

    d: 29 ^ 47

};
    /*
    VIP USER ID

    Untuk sementara ID milikmu:


    Disimpan sebagai hash FNV-1a.

    Nanti kita buat helper khusus untuk menghasilkan
    hash VIP customer baru.
    */

// =====================================================
// PREMIUM ACCOUNT REGISTRY
// HASH-ONLY PREMIUM ACCOUNT IDENTIFICATION
//
// Akun yang TIDAK terdaftar di sini akan masuk:
// FREE_ACCESS  -> selama FREE_LIMIT masih aktif
// FREE_EXPIRED -> setelah FREE_LIMIT berakhir
// =====================================================

const PREMIUM_ACCOUNTS = new Map([

    [
        "f96171bd",
        {
            name: "KANGODING.ORG",
            plan: "VIP_LORD",
            authority: "SOVEREIGN"
        }
    ],

    [
        "a95c648c",
        {
            name: "EDSEN",
            plan: "TEMEN CEO KANGODING.ORG WKWK",
            authority: "PREMIUM"
        }
    ],
 [
        "85c9f2b1",
        {
            name: "MBA WARI ANJAY",
            plan: "VIP_LIFETIME",
            authority: "PREMIUM"
        }
    ]


]);

    // =====================================================
    // PRIVATE STATE
    // =====================================================

let state = {

    booted: false,

    dead: false,

    authorized: false,

    userId: "",

    accountName: "",

    plan: "NONE",

    authority: "",

    reason: ""

};

    let integrityTimer = null;

    let mutationTimer = null;


    // =====================================================
    // DECODE ASCII
    // =====================================================

    function decode(parts){

        return String.fromCharCode(...parts);

    }


    function getProductCode(){

        return decode(PRODUCT_CODE_PARTS);

    }


    function getOwnerId(){

        return decode(OWNER_ID_PARTS);

    }


    function getBrand(){

        return decode(BRAND_PARTS);

    }


    // =====================================================
    // NORMALIZE
    // =====================================================

    function text(value){

        return String(value ?? "")
            .trim()
            .toUpperCase();

    }


    // =====================================================
    // HASH
    // =====================================================

    function hashValue(value){

        const input = text(value);

        let hash = 0x811c9dc5;


        for(let i = 0; i < input.length; i++){

            hash ^= input.charCodeAt(i);

            hash = Math.imul(

                hash,

                0x01000193

            );

        }


        return (

            hash >>> 0

        )
        .toString(16)
        .padStart(8, "0");

    }


    // =====================================================
    // FREE ACCESS LIMIT
    // =====================================================

    function getFreeLimit(){

        return {

            year:

                FREE_LIMIT.y ^ 731,

            month:

                FREE_LIMIT.m ^ 29,

            day:

                FREE_LIMIT.d ^ 47

        };

    }


    function getFreeLimitDate(){

        const limit =

            getFreeLimit();


        return new Date(

            limit.year,

            limit.month - 1,

            limit.day,

            23,

            59,

            59,

            999

        );

    }


    // =====================================================
    // EXTRACT USER ID
    // DAILY CASH CELL A2
    // =====================================================

    function extractUserId(rows){

        if(!Array.isArray(rows)){

            return "";

        }


        return text(

            rows?.[1]?.[0]

        );

    }


    // =====================================================
    // VIP CHECK
    // =====================================================

    function getPremiumAccount(userId){

    const userHash =
        hashValue(userId);


    return (

        PREMIUM_ACCOUNTS.get(userHash)

        || null

    );

}
    // =====================================================
    // FREE ACCESS CHECK
    // =====================================================

    function isFreeActive(){

        return (

            Date.now() <=

            getFreeLimitDate().getTime()

        );

    }


    // =====================================================
    // INTEGRITY CHECK
    // =====================================================

    function checkIntegrity(){ return true;

        if(state.dead){

            return false;

        }


        const ownerId =

            getOwnerId();


        const brand =

            getBrand();


        const productCode =

            getProductCode();


        const meta =

            document.querySelector(

                'meta[name="gt-runtime"]'

            );


        const anchor =

            document.getElementById(

                "gt-runtime-anchor"

            );


        const watermark =

    document.getElementById(

        "KANGODING.ORGWatermark"

    );

        const logo =

            document.querySelector(

                "img.logo"

            );


        const metaValid =

            meta &&

            meta.content ===

            `${brand}:${ownerId}:${productCode}`;


        const anchorValid =

            anchor &&

            anchor.dataset.owner === ownerId &&

            anchor.dataset.product === productCode;


        const watermarkText =

            text(

                watermark?.textContent

            );


        const watermarkValid = Boolean(

    watermark &&

    watermark.dataset.owner === ownerId &&

    watermarkText.includes(brand) &&

    watermarkText.includes(ownerId)

);
        const logoValid =

            logo &&

            logo.getAttribute("src") ===

            "img/logo.png";


console.table({

    metaValid,

    anchorValid,

    watermarkValid,

    logoValid,

    metaContent:
        meta?.content || "NOT FOUND",

    anchorOwner:
        anchor?.dataset.owner || "NOT FOUND",

    anchorProduct:
        anchor?.dataset.product || "NOT FOUND",

    watermarkText,

    logoSrc:
        logo?.getAttribute("src") || "NOT FOUND"

});


        return Boolean(

            metaValid &&

            anchorValid &&

            watermarkValid &&

            logoValid

        );

    }


    // =====================================================
    // DESTROY APPLICATION
    // =====================================================

    function kill(reason){

        if(state.dead){

            return;

        }


        state.dead = true;

        state.authorized = false;

        state.reason =

            reason ||

            "RUNTIME_FAILURE";


        if(integrityTimer){

            clearInterval(

                integrityTimer

            );

        }


        if(mutationTimer){

            clearTimeout(

                mutationTimer

            );

        }


        try{

            if(

                typeof GTEngine !==

                "undefined"

            ){

                GTEngine.clear();

            }

        }

        catch(error){

            console.error(error);

        }


        window.summaryData = [];

        window.divisionData = [];


        document.body.innerHTML = `

            <main class="gt-runtime-error">

                <div class="gt-runtime-error-card">

                    <strong>

                        KANGODING.ORG

                    </strong>


                    <h1>

                        APPLICATION INTEGRITY ERROR

                    </h1>


                    <p>

                        GT AUTO SALES STAFF
                        cannot continue.

                    </p>


                    <small>

                        ERROR CODE:
                        ${state.reason}

                    </small>

                </div>

            </main>

        `;


        throw new Error(

            "GT_RUNTIME_TERMINATED"

        );

    }


    // =====================================================
    // ASSERT INTEGRITY
    // =====================================================

    function assertIntegrity(){

        if(!checkIntegrity()){

            kill(

                "INTEGRITY_FAILURE"

            );

            return false;

        }


        return true;

    }


    // =====================================================
    // AUTHORIZE USER
    // =====================================================

    function authorize(rows){

    assertIntegrity();


    const userId =
        extractUserId(rows);


    // =============================================
    // USER ID NOT FOUND
    // =============================================

    if(!userId){

        state.authorized = false;

        state.userId = "";

        state.plan = "NONE";

        state.accountName = "";

        state.authority = "";

        state.reason =
            "USER_ID_NOT_FOUND";


        return {

            ok: false,

            userId: "",

            accountName: "",

            plan: "NONE",

            authority: "",

            reason:
                "USER_ID_NOT_FOUND"

        };

    }


    // =============================================
    // PREMIUM ACCOUNT CHECK
    // HASH-ONLY LOOKUP
    // =============================================

    const premiumAccount =
        getPremiumAccount(userId);


    if(premiumAccount){

        state.authorized = true;

        state.userId = userId;

        state.accountName =
            premiumAccount.name;

        state.plan =
            premiumAccount.plan;

        state.authority =
            premiumAccount.authority;

        state.reason = "";


        console.log(

            "PREMIUM ACCOUNT AUTHORIZED:",

            {

                userHash:
                    hashValue(userId),

                accountName:
                    premiumAccount.name,

                plan:
                    premiumAccount.plan,

                authority:
                    premiumAccount.authority

            }

        );


        return {

            ok: true,

            userId,

            accountName:
                premiumAccount.name,

            plan:
                premiumAccount.plan,

            authority:
                premiumAccount.authority,

            reason: ""

        };

    }


    // =============================================
    // FREE ACCESS
    // HANYA UNTUK ACCOUNT NON-PREMIUM
    // =============================================

    if(isFreeActive()){

        state.authorized = true;

        state.userId = userId;

        state.accountName = "FREE USER";

        state.plan =
            "FREE_ACCESS";

        state.authority =
            "STANDARD";

        state.reason = "";


        return {

            ok: true,

            userId,

            accountName:
                "FREE USER",

            plan:
                "FREE_ACCESS",

            authority:
                "STANDARD",

            reason: ""

        };

    }


    // =============================================
    // FREE EXPIRED
    // =============================================

    state.authorized = false;

    state.userId = userId;

    state.accountName = "FREE USER";

    state.plan =
        "FREE_EXPIRED";

    state.authority =
        "NONE";

    state.reason =
        "FREE_ACCESS_EXPIRED";


    return {

        ok: false,

        userId,

        accountName:
            "FREE USER",

        plan:
            "FREE_EXPIRED",

        authority:
            "NONE",

        reason:
            "FREE_ACCESS_EXPIRED"

    };

}
    // =====================================================
    // ENGINE ACCESS CHECK
    // =====================================================

    function assertEngineAccess(){

        assertIntegrity();


        if(

            !state.authorized ||

            state.dead

        ){

            throw new Error(

                "ENGINE_ACCESS_DENIED"

            );

        }


        return true;

    }


    // =====================================================
    // PRINT ACCESS CHECK
    // =====================================================

    function assertPrintAccess(){

        return assertEngineAccess();

    }


    // =====================================================
    // START RUNTIME WATCH
    // =====================================================

    function boot(){

        if(state.booted){

            return;

        }


        if(!checkIntegrity()){

            kill(

                "BOOT_INTEGRITY_FAILURE"

            );

            return;

        }


        state.booted = true;


        integrityTimer =

            setInterval(() => {

                if(

                    !checkIntegrity()

                ){

                    kill(

                        "RUNTIME_INTEGRITY_FAILURE"

                    );

                }

            }, 2500);


        const observer =

            new MutationObserver(() => {

                clearTimeout(

                    mutationTimer

                );


                mutationTimer =

                    setTimeout(() => {

                        if(

                            !checkIntegrity()

                        ){

                            kill(

                                "DOM_INTEGRITY_FAILURE"

                            );

                        }

                    }, 100);

            });


        observer.observe(

            document.documentElement,

            {

                childList: true,

                subtree: true,

                attributes: true

            }

        );

    }


    // =====================================================
    // STATUS
    // =====================================================

    function getStatus(){

    const freeLimit =
        getFreeLimit();


    return {

        booted:
            state.booted,

        dead:
            state.dead,

        authorized:
            state.authorized,

        userId:
            state.userId,

        accountName:
            state.accountName,

        plan:
            state.plan,

        authority:
            state.authority,

        reason:
            state.reason,

        freeLimit: {

            year:
                freeLimit.year,

            month:
                freeLimit.month,

            day:
                freeLimit.day

        }

    };

}
    // =====================================================
    // PUBLIC API
    // =====================================================

    return {

        boot,

        authorize,

        assertIntegrity,

        assertEngineAccess,

        assertPrintAccess,

        getStatus

    };

})();

