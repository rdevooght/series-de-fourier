<footer>
    <p>Un outil par <a href="/">Robin Devooght</a></p>
    <p></p>
</footer>

<style>
    footer {
        position: relative;
        max-width: 700px;
        margin: 10px auto;
        width: 100%;
        padding-top: 5px;
    }
    footer::before {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 50%;
        height: 1px;
        width: 50%;
        transform: translateX(-50%) translateY(-1px);
        background-color: gray;
    }
</style>
